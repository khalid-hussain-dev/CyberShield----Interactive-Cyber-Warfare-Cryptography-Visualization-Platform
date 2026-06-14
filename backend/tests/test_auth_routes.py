import tempfile
import unittest
from pathlib import Path

from app import create_app


class AuthRouteTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = str(Path(self.temp_dir.name) / 'auth-test.sqlite')
        self.client = create_app(
            {
                'TESTING': True,
                'DATABASE_PATH': self.database_path,
                'SECRET_KEY': 'test-secret',
            }
        ).test_client()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_register_login_and_me_flow(self):
        register_response = self.client.post(
            '/api/auth/register',
            json={
                'username': 'student_operator',
                'email': 'student@example.com',
                'password': 'SecurePass123',
            },
        )
        register_body = register_response.get_json()

        self.assertEqual(register_response.status_code, 201)
        self.assertTrue(register_body['success'])
        self.assertIn('access_token', register_body['data'])
        self.assertEqual(register_body['data']['user']['role'], 'student')

        login_response = self.client.post(
            '/api/auth/login',
            json={
                'email': 'student@example.com',
                'password': 'SecurePass123',
            },
        )
        login_body = login_response.get_json()

        self.assertEqual(login_response.status_code, 200)
        self.assertTrue(login_body['success'])

        me_response = self.client.get(
            '/api/auth/me',
            headers={'Authorization': f"Bearer {login_body['data']['access_token']}"},
        )
        me_body = me_response.get_json()

        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_body['data']['user']['email'], 'student@example.com')
        self.assertEqual(me_body['data']['user']['username'], 'student_operator')

    def test_duplicate_registration_returns_conflict(self):
        payload = {
            'username': 'operator',
            'email': 'operator@example.com',
            'password': 'SecurePass123',
        }

        self.client.post('/api/auth/register', json=payload)
        response = self.client.post('/api/auth/register', json=payload)
        body = response.get_json()

        self.assertEqual(response.status_code, 409)
        self.assertFalse(body['success'])

    def test_invalid_login_returns_unauthorized(self):
        response = self.client.post(
            '/api/auth/login',
            json={'email': 'missing@example.com', 'password': 'SecurePass123'},
        )
        body = response.get_json()

        self.assertEqual(response.status_code, 401)
        self.assertFalse(body['success'])

    def test_me_requires_bearer_token(self):
        response = self.client.get('/api/auth/me')
        body = response.get_json()

        self.assertEqual(response.status_code, 401)
        self.assertFalse(body['success'])


if __name__ == '__main__':
    unittest.main()

