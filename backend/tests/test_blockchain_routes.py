import tempfile
import unittest
from pathlib import Path

from app import create_app


class BlockchainRouteTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = str(Path(self.temp_dir.name) / 'blockchain-test.sqlite')
        self.client = create_app(
            {
                'TESTING': True,
                'DATABASE_PATH': self.database_path,
                'SECRET_KEY': 'test-secret',
            }
        ).test_client()

        # Pre-register a test user
        register_response = self.client.post(
            '/api/auth/register',
            json={
                'username': 'operator_blockchain',
                'email': 'blockchain@example.com',
                'password': 'SecurePass123',
            },
        )
        self.token = register_response.get_json()['data']['access_token']
        self.auth_headers = {'Authorization': f'Bearer {self.token}'}

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_blockchain_lifecycle(self):
        # 1. Verify chain is empty initially
        get_response = self.client.get('/api/blockchain/chain', headers=self.auth_headers)
        get_body = get_response.get_json()
        self.assertEqual(get_response.status_code, 200)
        self.assertTrue(get_body['success'])
        self.assertEqual(len(get_body['data']['chain']), 0)

        # 2. Save a report which should auto-mine a block
        save_response = self.client.post(
            '/api/reports',
            json={
                'scenario_id': 'bank-mitm',
                'scenario_name': 'Bank MITM',
                'risk_score_before': 80,
                'risk_score_after': 10,
            },
            headers=self.auth_headers,
        )
        self.assertEqual(save_response.status_code, 201)

        # 3. Verify chain has 1 block now
        get_response = self.client.get('/api/blockchain/chain', headers=self.auth_headers)
        get_body = get_response.get_json()
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(len(get_body['data']['chain']), 1)
        block = get_body['data']['chain'][0]
        self.assertEqual(block['block_index'], 0)
        self.assertEqual(block['payload']['scenario_id'], 'bank-mitm')
        self.assertEqual(block['prev_hash'], '0' * 64)

        # 4. Verify chain integrity
        verify_response = self.client.get('/api/blockchain/verify', headers=self.auth_headers)
        verify_body = verify_response.get_json()
        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_body['success'])
        self.assertTrue(verify_body['data']['valid'])
        self.assertEqual(verify_body['data']['total_blocks'], 1)

    def test_blockchain_tampering(self):
        # 1. Tamper fails when there are no blocks
        tamper_response = self.client.post('/api/blockchain/tamper', headers=self.auth_headers)
        self.assertEqual(tamper_response.status_code, 400)

        # 2. Mine a block
        self.client.post(
            '/api/reports',
            json={
                'scenario_id': 'bank-mitm',
                'scenario_name': 'Bank MITM',
                'risk_score_before': 80,
                'risk_score_after': 10,
            },
            headers=self.auth_headers,
        )

        # 3. Tamper succeeds
        tamper_response = self.client.post('/api/blockchain/tamper', headers=self.auth_headers)
        self.assertEqual(tamper_response.status_code, 200)

        # 4. Verification should now FAIL
        verify_response = self.client.get('/api/blockchain/verify', headers=self.auth_headers)
        verify_body = verify_response.get_json()
        self.assertEqual(verify_response.status_code, 200)
        self.assertFalse(verify_body['data']['valid'])
        self.assertEqual(verify_body['data']['broken_at'], 0)

        # 5. Restore succeeds
        restore_response = self.client.post('/api/blockchain/restore', headers=self.auth_headers)
        self.assertEqual(restore_response.status_code, 200)

        # 6. Verification should now PASS again
        verify_response = self.client.get('/api/blockchain/verify', headers=self.auth_headers)
        verify_body = verify_response.get_json()
        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_body['data']['valid'])


if __name__ == '__main__':
    unittest.main()
