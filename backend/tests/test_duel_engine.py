"""tests/test_duel_engine.py — Unit tests for the duel engine."""
import unittest

# We import the engine directly (no Flask app context needed as it's pure logic)
from app.simulation_engine.duel_engine import (
    ATTACKS,
    DEFENSES,
    create_room,
    get_catalogues,
    join_room,
    process_attack,
    process_defense,
    set_ready,
    _rooms,  # access internal store for cleanup
)


def _fresh_room(scenario_id='bank-mitm'):
    """Helper: create a room and return its code."""
    return create_room(scenario_id=scenario_id)


def _populate_room(room_code):
    """Helper: add both players to a room and return the room."""
    join_room(room_code, user_id=1, username='attacker_user', sid='sid1')
    join_room(room_code, user_id=2, username='defender_user', sid='sid2')
    set_ready(room_code, user_id=1)
    set_ready(room_code, user_id=2)
    return _rooms[room_code]


class TestDuelEngineRoomManagement(unittest.TestCase):
    def setUp(self):
        _rooms.clear()

    def test_create_room_generates_unique_codes(self):
        codes = {create_room() for _ in range(20)}
        self.assertEqual(len(codes), 20)

    def test_create_room_code_length(self):
        code = create_room()
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isupper() or code.isdigit() or any(c.isupper() for c in code))

    def test_join_room_first_player_is_attacker(self):
        code = _fresh_room()
        result = join_room(code, user_id=10, username='alice', sid='s1')
        self.assertEqual(result['role'], 'attacker')

    def test_join_room_second_player_is_defender(self):
        code = _fresh_room()
        join_room(code, user_id=10, username='alice', sid='s1')
        result = join_room(code, user_id=11, username='bob', sid='s2')
        self.assertEqual(result['role'], 'defender')

    def test_join_nonexistent_room_raises(self):
        with self.assertRaises(ValueError):
            join_room('XXXXXX', user_id=1, username='alice', sid='s1')

    def test_same_user_cannot_join_twice_as_defender(self):
        code = _fresh_room()
        join_room(code, user_id=10, username='alice', sid='s1')
        with self.assertRaises(ValueError):
            join_room(code, user_id=10, username='alice', sid='s2')

    def test_room_is_not_full_initially(self):
        code = _fresh_room()
        room_dict = join_room(code, user_id=1, username='a', sid='s1')['room']
        self.assertFalse(room_dict['full'])

    def test_room_is_full_after_two_players(self):
        code = _fresh_room()
        join_room(code, user_id=1, username='a', sid='s1')
        room_dict = join_room(code, user_id=2, username='b', sid='s2')['room']
        self.assertTrue(room_dict['full'])

    def test_both_ready_triggers_round_start(self):
        code = _fresh_room()
        join_room(code, user_id=1, username='a', sid='s1')
        join_room(code, user_id=2, username='b', sid='s2')
        set_ready(code, user_id=1)
        result = set_ready(code, user_id=2)
        self.assertTrue(result['both_ready'])


class TestDuelEngineRoundResolution(unittest.TestCase):
    def setUp(self):
        _rooms.clear()

    def _play_round(self, attack_type, defense_type):
        code = _fresh_room()
        _populate_room(code)
        atk_result = process_attack(code, user_id=1, attack_type=attack_type)
        def_result = process_defense(code, user_id=2, defense_type=defense_type)
        # One of them resolves the round
        resolved = atk_result if atk_result['resolved'] else def_result
        return resolved, code

    def test_effective_defense_blocks_attack(self):
        # Find a counter pair
        attack_type = 'syn_flood'
        defense_type = 'firewall'  # counters syn_flood
        self.assertIn('firewall', ATTACKS['syn_flood']['countered_by'])

        result, _ = self._play_round(attack_type, defense_type)
        self.assertTrue(result['resolved'])
        self.assertFalse(result['breach_success'])
        self.assertGreater(result['defender_earned'], 0)
        self.assertEqual(result['attacker_earned'], 0)

    def test_ineffective_defense_allows_breach(self):
        # sql_injection is NOT countered by rate_limiter
        attack_type = 'sql_injection'
        defense_type = 'rate_limiter'
        self.assertNotIn('rate_limiter', ATTACKS['sql_injection']['countered_by'])

        result, _ = self._play_round(attack_type, defense_type)
        self.assertTrue(result['resolved'])
        self.assertTrue(result['breach_success'])
        self.assertGreater(result['attacker_earned'], 0)
        self.assertEqual(result['defender_earned'], 0)

    def test_round_advances_on_resolve(self):
        code = _fresh_room()
        _populate_room(code)
        process_attack(code, user_id=1, attack_type='syn_flood')
        process_defense(code, user_id=2, defense_type='rate_limiter')
        room = _rooms[code]
        # After one resolved round, either game over or round 2
        if not room.game_over:
            self.assertEqual(room.current_round.number, 2)

    def test_duplicate_attack_raises(self):
        code = _fresh_room()
        _populate_room(code)
        process_attack(code, user_id=1, attack_type='brute_force')
        with self.assertRaises(ValueError):
            process_attack(code, user_id=1, attack_type='syn_flood')

    def test_duplicate_defense_raises(self):
        code = _fresh_room()
        _populate_room(code)
        process_defense(code, user_id=2, defense_type='firewall')
        with self.assertRaises(ValueError):
            process_defense(code, user_id=2, defense_type='ids')

    def test_wrong_player_cannot_attack(self):
        code = _fresh_room()
        _populate_room(code)
        with self.assertRaises(ValueError):
            process_attack(code, user_id=2, attack_type='syn_flood')  # user_id=2 is defender

    def test_wrong_player_cannot_defend(self):
        code = _fresh_room()
        _populate_room(code)
        with self.assertRaises(ValueError):
            process_defense(code, user_id=1, defense_type='firewall')  # user_id=1 is attacker


class TestDuelEngineCatalogues(unittest.TestCase):
    def test_all_attacks_have_required_fields(self):
        for key, attack in ATTACKS.items():
            self.assertIn('label', attack, f"Attack {key} missing 'label'")
            self.assertIn('description', attack, f"Attack {key} missing 'description'")
            self.assertIn('base_power', attack, f"Attack {key} missing 'base_power'")
            self.assertIn('countered_by', attack, f"Attack {key} missing 'countered_by'")

    def test_all_defenses_have_required_fields(self):
        for key, defense in DEFENSES.items():
            self.assertIn('label', defense, f"Defense {key} missing 'label'")
            self.assertIn('description', defense, f"Defense {key} missing 'description'")

    def test_all_counters_reference_valid_defenses(self):
        for key, attack in ATTACKS.items():
            for counter in attack['countered_by']:
                self.assertIn(counter, DEFENSES, f"Attack {key} references unknown defense '{counter}'")

    def test_get_catalogues_returns_both_keys(self):
        cat = get_catalogues()
        self.assertIn('attacks', cat)
        self.assertIn('defenses', cat)
        self.assertGreaterEqual(len(cat['attacks']), 5)
        self.assertGreaterEqual(len(cat['defenses']), 5)


if __name__ == '__main__':
    unittest.main()
