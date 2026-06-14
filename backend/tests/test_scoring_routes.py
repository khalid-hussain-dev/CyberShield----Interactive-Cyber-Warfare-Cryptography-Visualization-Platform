import tempfile
import unittest
from pathlib import Path

from app import create_app


class ScoringRouteTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = str(Path(self.temp_dir.name) / 'scoring-test.sqlite')
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
                'username': 'operator_scoring',
                'email': 'scoring@example.com',
                'password': 'SecurePass123',
            },
        )
        self.token = register_response.get_json()['data']['access_token']
        self.auth_headers = {'Authorization': f'Bearer {self.token}'}

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_scoring_lifecycle(self):
        # 1. Check score defaults
        get_response = self.client.get('/api/scores/me', headers=self.auth_headers)
        get_body = get_response.get_json()
        self.assertEqual(get_response.status_code, 200)
        self.assertTrue(get_body['success'])
        self.assertEqual(get_body['data']['score']['xp'], 0)
        self.assertEqual(get_body['data']['score']['rank'], 'Trainee')

        # 2. Record dynamic events
        post_response = self.client.post(
            '/api/scores/event',
            json={'event_type': 'defend'},
            headers=self.auth_headers,
        )
        post_body = post_response.get_json()
        self.assertEqual(post_response.status_code, 200)
        self.assertTrue(post_body['success'])
        self.assertEqual(post_body['data']['score']['xp'], 25)
        self.assertEqual(post_body['data']['score']['defenses_deployed'], 1)

        # 3. Check rank upgrade
        post_response = self.client.post(
            '/api/scores/event',
            json={'event_type': 'defend'},
            headers=self.auth_headers,
        )
        post_body = post_response.get_json()
        self.assertEqual(post_body['data']['score']['xp'], 50)
        self.assertEqual(post_body['data']['score']['rank'], 'Analyst')

        # 4. Check leaderboard
        leader_response = self.client.get('/api/scores/leaderboard', headers=self.auth_headers)
        leader_body = leader_response.get_json()
        self.assertEqual(leader_response.status_code, 200)
        self.assertTrue(leader_body['success'])
        self.assertEqual(len(leader_body['data']['leaderboard']), 1)
        self.assertEqual(leader_body['data']['leaderboard'][0]['username'], 'operator_scoring')
        self.assertEqual(leader_body['data']['leaderboard'][0]['xp'], 50)


if __name__ == '__main__':
    unittest.main()
