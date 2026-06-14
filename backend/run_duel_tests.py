"""
Standalone test script for duel_engine.py
Patches Flask-dependent modules before any import occurs.
"""
import sys
import os
import types

# ── Patch ALL Flask/app modules before importing anything ──────────────────
def _make_fake(name):
    m = types.ModuleType(name)
    sys.modules[name] = m
    return m

# Fake flask
flask_mod = _make_fake('flask')
flask_mod.current_app = None
flask_mod.Flask = object
flask_mod.Blueprint = object
flask_mod.g = object
flask_mod.request = object
flask_mod.jsonify = lambda *a, **kw: None

# Fake flask_socketio
_make_fake('flask_socketio')

# Fake app (top-level package) and sub-packages
_make_fake('app')
_make_fake('app.extensions')
_make_fake('app.config')
_make_fake('app.routes')
_make_fake('app.utils')
_make_fake('app.utils.errors')

# Fake auth modules
auth_storage = _make_fake('app.auth.storage')
auth_storage.initialize_auth_storage = lambda app: None
auth_storage.get_connection = lambda: None
_make_fake('app.auth')
_make_fake('app.auth.token_service')
_make_fake('app.auth.auth_service')
_make_fake('app.auth.decorators')

# Fake scoring engine (duel_events imports it)
scoring = _make_fake('app.simulation_engine.scoring_engine')
scoring.award_xp = lambda user_id, event: {'xp': 0}

# Fake realtime
_make_fake('app.realtime')
_make_fake('app.realtime.events')

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

# ── Now safely import the duel engine ──────────────────────────────────────
# We need to load it from the file directly to avoid the package __init__
import importlib.util

engine_path = os.path.join(os.path.dirname(__file__), 'app', 'simulation_engine', 'duel_engine.py')
spec = importlib.util.spec_from_file_location('duel_engine', engine_path)
duel_engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(duel_engine)

ATTACKS = duel_engine.ATTACKS
DEFENSES = duel_engine.DEFENSES
create_room = duel_engine.create_room
get_catalogues = duel_engine.get_catalogues
join_room = duel_engine.join_room
process_attack = duel_engine.process_attack
process_defense = duel_engine.process_defense
set_ready = duel_engine.set_ready
_rooms = duel_engine._rooms

# ── Test harness ───────────────────────────────────────────────────────────
PASS = 0
FAIL = 0

def test(name, condition, msg=''):
    global PASS, FAIL
    if condition:
        print(f'  [PASS] {name}')
        PASS += 1
    else:
        print(f'  [FAIL] {name}  [{msg}]')
        FAIL += 1

def fresh():
    _rooms.clear()
    return create_room()

def populated(code):
    join_room(code, 1, 'attacker_user', 'sid1')
    join_room(code, 2, 'defender_user', 'sid2')
    set_ready(code, 1)
    set_ready(code, 2)

print('\n=== Room Management ===')
_rooms.clear()
code = fresh()
test('Code length 6', len(code) == 6)
codes = {create_room() for _ in range(20)}
test('20 unique codes generated', len(codes) == 20, f'only {len(codes)}')

_rooms.clear()
code = fresh()
r1 = join_room(code, 10, 'alice', 's1')
test('First joiner is attacker', r1['role'] == 'attacker')
r2 = join_room(code, 11, 'bob', 's2')
test('Second joiner is defender', r2['role'] == 'defender')
test('Room full after 2 players', r2['room']['full'] is True)

_rooms.clear()
code = fresh()
join_room(code, 1, 'a', 's1')
join_room(code, 2, 'b', 's2')
set_ready(code, 1)
result = set_ready(code, 2)
test('Both ready triggers round start', result['both_ready'] is True)

_rooms.clear()
code = fresh()
try:
    join_room(code, 1, 'a', 's1')
    join_room(code, 1, 'a', 's2')
    test('Same user cannot join twice', False, 'No ValueError raised')
except ValueError:
    test('Same user cannot join twice', True)

_rooms.clear()
try:
    join_room('XXXXXX', 1, 'a', 's1')
    test('Join nonexistent room raises', False, 'No ValueError raised')
except ValueError:
    test('Join nonexistent room raises', True)

print('\n=== Catalogue Integrity ===')
for key, atk in ATTACKS.items():
    test(f'Attack {key} has label', 'label' in atk)
    test(f'Attack {key} has base_power', 'base_power' in atk)
    test(f'Attack {key} counters are valid defenses', all(c in DEFENSES for c in atk['countered_by']))

cat = get_catalogues()
test('Catalogue has attacks key', 'attacks' in cat)
test('Catalogue has defenses key', 'defenses' in cat)
test('At least 5 attacks', len(cat['attacks']) >= 5)
test('At least 5 defenses', len(cat['defenses']) >= 5)

print('\n=== Round Resolution ===')
_rooms.clear()
code = fresh()
populated(code)
# sql_injection IS countered by waf
atk_r = process_attack(code, 1, 'sql_injection')
def_r = process_defense(code, 2, 'waf')
resolved = atk_r if atk_r['resolved'] else def_r
test('Round resolves when both choices made', resolved['resolved'] is True)
test('WAF blocks sql_injection (countered_by includes waf)', resolved['breach_success'] is False)
test('Defender earns points on block', resolved['defender_earned'] > 0)
test('Attacker earns 0 on blocked attack', resolved['attacker_earned'] == 0)

_rooms.clear()
code = fresh()
populated(code)
# syn_flood NOT countered by waf
atk_r = process_attack(code, 1, 'syn_flood')
def_r = process_defense(code, 2, 'waf')
resolved = atk_r if atk_r['resolved'] else def_r
test('Ineffective defense allows breach', resolved['breach_success'] is True)
test('Attacker earns points on successful breach', resolved['attacker_earned'] > 0)
test('Defender earns 0 on failed defense', resolved['defender_earned'] == 0)

_rooms.clear()
code = fresh()
populated(code)
process_attack(code, 1, 'brute_force')
try:
    process_attack(code, 1, 'syn_flood')
    test('Duplicate attack raises ValueError', False, 'No error raised')
except ValueError:
    test('Duplicate attack raises ValueError', True)

_rooms.clear()
code = fresh()
populated(code)
try:
    process_attack(code, 2, 'brute_force')
    test('Defender cannot attack', False, 'No error raised')
except ValueError:
    test('Defender cannot attack', True)

_rooms.clear()
code = fresh()
populated(code)
try:
    process_defense(code, 1, 'firewall')
    test('Attacker cannot defend', False, 'No error raised')
except ValueError:
    test('Attacker cannot defend', True)

print('\n=== Game Progression ===')
_rooms.clear()
code = fresh()
populated(code)
# Play 3 rounds: attacker wins by using attacks not countered by the chosen defense
# Round 1: syn_flood vs waf (not countered → attacker wins)
atk_r = process_attack(code, 1, 'syn_flood')
def_r = process_defense(code, 2, 'waf')
r = atk_r if atk_r['resolved'] else def_r
test('Round 1 resolves', r['resolved'] is True)

room = _rooms[code]
if not room.game_over:
    # Round 2
    atk_r = process_attack(code, 1, 'sql_injection')
    def_r = process_defense(code, 2, 'rate_limiter')  # not a counter for sql_injection
    r = atk_r if atk_r['resolved'] else def_r
    test('Round 2 resolves', r['resolved'] is True)

    if not room.game_over:
        test('Game continues to round 3', room.current_round.number == 3)
    else:
        test('Game over after 2 attacker wins (best of 3)', room.game_over is True)
        test('Winner is attacker', room.winner_role == 'attacker')
else:
    test('Game can end in 2 rounds', room.game_over is True)

print(f'\n{"="*40}')
print(f'Results: {PASS} passed, {FAIL} failed out of {PASS+FAIL} tests')
if FAIL == 0:
    print('ALL TESTS PASSED')
    sys.exit(0)
else:
    print('SOME TESTS FAILED')
    sys.exit(1)
