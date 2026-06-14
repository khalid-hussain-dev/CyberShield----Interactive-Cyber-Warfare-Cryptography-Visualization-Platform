import unittest

from app import create_app


class SimulationRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app({'TESTING': True}).test_client()

    def test_scenarios_endpoint_lists_bank_mitm(self):
        response = self.client.get('/api/scenarios')
        body = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(body['success'])
        scenario_ids = [scenario['id'] for scenario in body['data']['scenarios']]
        self.assertIn('bank-mitm', scenario_ids)

    def test_bank_mitm_plaintext_exposes_payload(self):
        response = self.client.post(
            '/api/simulations/run',
            json={'scenario_id': 'bank-mitm', 'defense_enabled': False, 'launched': True},
        )
        body = response.get_json()
        intercepted = next(packet for packet in body['data']['packets'] if packet['intercepted'])

        self.assertEqual(response.status_code, 200)
        self.assertTrue(body['data']['attack_success'])
        self.assertTrue(intercepted['readable'])
        self.assertIn('TXN|from=ACCT-7721', intercepted['payload_preview'])

    def test_bank_mitm_encryption_blocks_readable_payload(self):
        response = self.client.post(
            '/api/simulations/run',
            json={'scenario_id': 'bank-mitm', 'defense_enabled': True, 'launched': True},
        )
        body = response.get_json()
        intercepted = next(packet for packet in body['data']['packets'] if packet['intercepted'])

        self.assertEqual(response.status_code, 200)
        self.assertFalse(body['data']['attack_success'])
        self.assertFalse(intercepted['readable'])
        self.assertNotIn('TXN|from=ACCT-7721', intercepted['payload_preview'])
        self.assertEqual(body['data']['channel']['algorithm'], 'AES-256-GCM')

    def test_password_bruteforce_without_lockout_recovers_password(self):
        response = self.client.post(
            '/api/simulations/run',
            json={'scenario_id': 'password-bruteforce', 'defense_enabled': False, 'launched': True},
        )
        body = response.get_json()
        accepted = [packet for packet in body['data']['packets'] if packet['status'] == 'accepted']

        self.assertEqual(response.status_code, 200)
        self.assertTrue(body['data']['attack_success'])
        self.assertEqual(body['data']['channel']['status'], 'compromised')
        self.assertEqual(len(accepted), 1)
        self.assertIn('SecurePass123', accepted[0]['payload_preview'])

    def test_password_bruteforce_lockout_blocks_password_discovery(self):
        response = self.client.post(
            '/api/simulations/run',
            json={'scenario_id': 'password-bruteforce', 'defense_enabled': True, 'launched': True},
        )
        body = response.get_json()
        lockout_packets = [packet for packet in body['data']['packets'] if packet['status'] == 'locked']

        self.assertEqual(response.status_code, 200)
        self.assertFalse(body['data']['attack_success'])
        self.assertEqual(body['data']['channel']['status'], 'locked')
        self.assertEqual(len(lockout_packets), 1)
        self.assertNotIn('SecurePass123', ''.join(packet['payload_preview'] for packet in body['data']['packets']))

    def test_packet_sniffing_plaintext_exposes_payloads(self):
        response = self.client.post(
            '/api/simulations/run',
            json={'scenario_id': 'packet-sniffing', 'defense_enabled': False, 'launched': True},
        )
        body = response.get_json()
        readable_packets = [packet for packet in body['data']['packets'] if packet['readable']]

        self.assertEqual(response.status_code, 200)
        self.assertTrue(body['data']['attack_success'])
        self.assertEqual(body['data']['channel']['status'], 'exposed')
        self.assertEqual(len(readable_packets), 4)
        self.assertIn('Authorizatio', ''.join(packet['payload_preview'] for packet in readable_packets))

    def test_packet_sniffing_encryption_hides_payloads(self):
        response = self.client.post(
            '/api/simulations/run',
            json={'scenario_id': 'packet-sniffing', 'defense_enabled': True, 'launched': True},
        )
        body = response.get_json()
        readable_packets = [packet for packet in body['data']['packets'] if packet['readable']]
        payload_text = ''.join(packet['payload_preview'] for packet in body['data']['packets'])

        self.assertEqual(response.status_code, 200)
        self.assertFalse(body['data']['attack_success'])
        self.assertEqual(body['data']['channel']['status'], 'protected')
        self.assertEqual(body['data']['channel']['algorithm'], 'AES-256-GCM')
        self.assertEqual(len(readable_packets), 0)
        self.assertNotIn('Authorizatio', payload_text)

    def test_replay_attack_without_nonce_protection_accepts_duplicate(self):
        response = self.client.post(
            '/api/simulations/run',
            json={'scenario_id': 'replay-attack', 'defense_enabled': False, 'launched': True},
        )
        body = response.get_json()
        replay_packet = next(packet for packet in body['data']['packets'] if packet['id'] == 'replay-003')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(body['data']['attack_success'])
        self.assertEqual(body['data']['channel']['status'], 'replayed')
        self.assertEqual(replay_packet['status'], 'accepted')
        self.assertIn('nonce-20260527-884291', replay_packet['payload_preview'])

    def test_replay_attack_with_nonce_protection_rejects_duplicate(self):
        response = self.client.post(
            '/api/simulations/run',
            json={'scenario_id': 'replay-attack', 'defense_enabled': True, 'launched': True},
        )
        body = response.get_json()
        replay_packet = next(packet for packet in body['data']['packets'] if packet['id'] == 'replay-003')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(body['data']['attack_success'])
        self.assertEqual(body['data']['channel']['status'], 'rejected')
        self.assertEqual(body['data']['channel']['algorithm'], 'Nonce/session replay detection')
        self.assertEqual(replay_packet['status'], 'rejected')

    def test_unknown_scenario_returns_not_found(self):
        response = self.client.post('/api/simulations/run', json={'scenario_id': 'unknown'})
        body = response.get_json()

        self.assertEqual(response.status_code, 404)
        self.assertFalse(body['success'])


if __name__ == '__main__':
    unittest.main()
