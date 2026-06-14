"""
duel_engine.py
Real-time 2-player Attack vs Defense duel engine.
Manages room state, round progression, scoring, and XP awards.
"""
import random
import string
import time
from dataclasses import dataclass, field
from typing import Optional

# ─── Attack catalogue ────────────────────────────────────────────────────────
ATTACKS = {
    'syn_flood': {
        'label': 'SYN Flood',
        'description': 'Flood target with TCP SYN packets',
        'base_power': 30,
        'countered_by': {'rate_limiter', 'firewall'},
    },
    'sql_injection': {
        'label': 'SQL Injection',
        'description': 'Attempt to exfiltrate database via malformed query',
        'base_power': 45,
        'countered_by': {'waf', 'input_validator'},
    },
    'arp_spoof': {
        'label': 'ARP Spoof',
        'description': 'Poison ARP cache to intercept LAN traffic',
        'base_power': 35,
        'countered_by': {'arp_guard', 'ids'},
    },
    'replay_attack': {
        'label': 'Replay Attack',
        'description': 'Re-send a captured authentication token',
        'base_power': 40,
        'countered_by': {'nonce_validator', 'ids'},
    },
    'brute_force': {
        'label': 'Brute Force',
        'description': 'Dictionary attack against login endpoint',
        'base_power': 25,
        'countered_by': {'rate_limiter', 'lockout_policy'},
    },
}

# ─── Defense catalogue ───────────────────────────────────────────────────────
DEFENSES = {
    'firewall': {'label': 'Firewall Rules', 'description': 'Drop unsolicited packets at perimeter'},
    'rate_limiter': {'label': 'Rate Limiter', 'description': 'Throttle excessive request rates'},
    'waf': {'label': 'Web App Firewall', 'description': 'Filter malicious HTTP payloads'},
    'input_validator': {'label': 'Input Validator', 'description': 'Sanitise all user inputs server-side'},
    'arp_guard': {'label': 'ARP Guard', 'description': 'Dynamic ARP inspection on switch level'},
    'ids': {'label': 'AI-IDS Monitor', 'description': 'Isolation Forest anomaly detection'},
    'nonce_validator': {'label': 'Nonce Validator', 'description': 'One-time token enforcement'},
    'lockout_policy': {'label': 'Account Lockout', 'description': 'Lock account after N failed attempts'},
}

ROUNDS_TO_WIN = 2
ROUND_DURATION_SECONDS = 90

# ─── Room store (in-memory) ──────────────────────────────────────────────────
_rooms: dict[str, 'DuelRoom'] = {}


def _generate_room_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


@dataclass
class PlayerState:
    user_id: str
    username: str
    role: str  # 'attacker' or 'defender'
    score: int = 0
    rounds_won: int = 0
    ready: bool = False
    sid: str = ''


@dataclass
class RoundState:
    number: int = 1
    attack_choice: Optional[str] = None
    defense_choice: Optional[str] = None
    started_at: float = field(default_factory=time.time)
    resolved: bool = False
    attacker_earned: int = 0
    defender_earned: int = 0
    breach_success: bool = False


@dataclass
class DuelRoom:
    room_code: str
    attacker: Optional[PlayerState] = None
    defender: Optional[PlayerState] = None
    current_round: RoundState = field(default_factory=RoundState)
    scenario_id: str = 'bank-mitm'
    game_over: bool = False
    winner_role: Optional[str] = None
    created_at: float = field(default_factory=time.time)


# ─── Public API ──────────────────────────────────────────────────────────────

def create_room(scenario_id: str = 'bank-mitm') -> str:
    """Create a new duel room and return its room_code."""
    code = _generate_room_code()
    while code in _rooms:
        code = _generate_room_code()
    _rooms[code] = DuelRoom(room_code=code, scenario_id=scenario_id)
    return code


def join_room(room_code: str, user_id: str, username: str, sid: str) -> dict:
    """
    Join a room. First joiner becomes attacker, second becomes defender.
    Returns {'role': str, 'room': dict} or raises ValueError.
    """
    room = _rooms.get(room_code)
    if not room:
        raise ValueError(f"Room '{room_code}' does not exist.")
    if room.game_over:
        raise ValueError("This duel has already ended.")

    if room.attacker is None:
        role = 'attacker'
        room.attacker = PlayerState(
            user_id=user_id, username=username, role='attacker', sid=sid
        )
    elif room.defender is None:
        if room.attacker.user_id == user_id:
            raise ValueError("You are already in this room as the attacker.")
        role = 'defender'
        room.defender = PlayerState(
            user_id=user_id, username=username, role='defender', sid=sid
        )
    else:
        # Reconnect scenario
        if room.attacker.user_id == user_id:
            room.attacker.sid = sid
            role = 'attacker'
        elif room.defender.user_id == user_id:
            room.defender.sid = sid
            role = 'defender'
        else:
            raise ValueError("Room is full.")

    return {'role': role, 'room': _room_to_dict(room)}


def set_ready(room_code: str, user_id: str) -> dict:
    """Mark a player as ready. Returns room dict. If both ready, returns ready=True."""
    room = _get_room(room_code)
    player = _find_player(room, user_id)
    player.ready = True
    both_ready = (
        room.attacker is not None and room.attacker.ready
        and room.defender is not None and room.defender.ready
    )
    if both_ready:
        room.current_round = RoundState(number=1, started_at=time.time())
    return {'both_ready': both_ready, 'room': _room_to_dict(room)}


def process_attack(room_code: str, user_id: str, attack_type: str) -> dict:
    """
    Attacker locks in an attack choice for the current round.
    Returns updated round info.
    """
    room = _get_room(room_code)
    if room.attacker is None or room.attacker.user_id != user_id:
        raise ValueError("Only the attacker can fire attacks.")
    if attack_type not in ATTACKS:
        raise ValueError(f"Unknown attack: {attack_type}")
    if room.current_round.attack_choice is not None:
        raise ValueError("Attack already locked in for this round.")

    room.current_round.attack_choice = attack_type
    return _try_resolve_round(room)


def process_defense(room_code: str, user_id: str, defense_type: str) -> dict:
    """
    Defender deploys a defense for the current round.
    Returns updated round info.
    """
    room = _get_room(room_code)
    if room.defender is None or room.defender.user_id != user_id:
        raise ValueError("Only the defender can deploy defenses.")
    if defense_type not in DEFENSES:
        raise ValueError(f"Unknown defense: {defense_type}")
    if room.current_round.defense_choice is not None:
        raise ValueError("Defense already deployed for this round.")

    room.current_round.defense_choice = defense_type
    return _try_resolve_round(room)


def get_room_state(room_code: str) -> dict:
    room = _get_room(room_code)
    return _room_to_dict(room)


def get_catalogues() -> dict:
    return {
        'attacks': {k: {'label': v['label'], 'description': v['description']} for k, v in ATTACKS.items()},
        'defenses': {k: {'label': v['label'], 'description': v['description']} for k, v in DEFENSES.items()},
    }


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _get_room(room_code: str) -> DuelRoom:
    room = _rooms.get(room_code)
    if not room:
        raise ValueError(f"Room '{room_code}' not found.")
    return room


def _find_player(room: DuelRoom, user_id: str) -> PlayerState:
    if room.attacker and room.attacker.user_id == user_id:
        return room.attacker
    if room.defender and room.defender.user_id == user_id:
        return room.defender
    raise ValueError("Player not in this room.")


def _try_resolve_round(room: DuelRoom) -> dict:
    """If both players have made their choices, resolve the round."""
    rnd = room.current_round
    if rnd.attack_choice is None or rnd.defense_choice is None or rnd.resolved:
        return {'resolved': False, 'room': _room_to_dict(room)}

    attack = ATTACKS[rnd.attack_choice]
    counters = attack['countered_by']
    defense_blocks = rnd.defense_choice in counters

    attacker_points = 0
    defender_points = 0

    if defense_blocks:
        # Defender wins this exchange
        defender_points = 20 + random.randint(0, 10)
        rnd.breach_success = False
    else:
        # Attacker breaks through
        attacker_points = attack['base_power'] + random.randint(0, 15)
        rnd.breach_success = True

    rnd.attacker_earned = attacker_points
    rnd.defender_earned = defender_points
    rnd.resolved = True

    if room.attacker:
        room.attacker.score += attacker_points
    if room.defender:
        room.defender.score += defender_points

    # Determine round winner
    if defense_blocks and room.defender:
        room.defender.rounds_won += 1
    elif not defense_blocks and room.attacker:
        room.attacker.rounds_won += 1

    # Check game over
    game_result = _check_game_over(room)

    return {
        'resolved': True,
        'breach_success': rnd.breach_success,
        'attack_type': rnd.attack_choice,
        'defense_type': rnd.defense_choice,
        'attacker_earned': attacker_points,
        'defender_earned': defender_points,
        'round_number': rnd.number,
        'game_over': game_result['game_over'],
        'winner_role': game_result.get('winner_role'),
        'room': _room_to_dict(room),
    }


def _check_game_over(room: DuelRoom) -> dict:
    attacker_wins = room.attacker.rounds_won if room.attacker else 0
    defender_wins = room.defender.rounds_won if room.defender else 0

    if attacker_wins >= ROUNDS_TO_WIN:
        room.game_over = True
        room.winner_role = 'attacker'
        return {'game_over': True, 'winner_role': 'attacker'}
    elif defender_wins >= ROUNDS_TO_WIN:
        room.game_over = True
        room.winner_role = 'defender'
        return {'game_over': True, 'winner_role': 'defender'}
    else:
        # Advance to next round
        room.current_round = RoundState(
            number=room.current_round.number + 1,
            started_at=time.time()
        )
        return {'game_over': False}


def _room_to_dict(room: DuelRoom) -> dict:
    def player_dict(p: Optional[PlayerState]) -> Optional[dict]:
        if p is None:
            return None
        return {
            'user_id': p.user_id,
            'username': p.username,
            'role': p.role,
            'score': p.score,
            'rounds_won': p.rounds_won,
            'ready': p.ready,
        }

    return {
        'room_code': room.room_code,
        'scenario_id': room.scenario_id,
        'attacker': player_dict(room.attacker),
        'defender': player_dict(room.defender),
        'current_round': {
            'number': room.current_round.number,
            'attack_choice': room.current_round.attack_choice,
            'defense_choice': room.current_round.defense_choice,
            'resolved': room.current_round.resolved,
            'breach_success': room.current_round.breach_success,
            'attacker_earned': room.current_round.attacker_earned,
            'defender_earned': room.current_round.defender_earned,
        },
        'game_over': room.game_over,
        'winner_role': room.winner_role,
        'full': room.attacker is not None and room.defender is not None,
    }
