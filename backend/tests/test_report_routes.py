import tempfile
import unittest
from pathlib import Path

from app import create_app


class ReportRouteTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = str(Path(self.temp_dir.name) / 'report-test.sqlite')
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
                'username': 'operator_x',
                'email': 'operator_x@example.com',
                'password': 'SecurePass123',
            },
        )
        self.token = register_response.get_json()['data']['access_token']
        self.auth_headers = {'Authorization': f'Bearer {self.token}'}

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_save_and_retrieve_reports(self):
        # 1. Verify get starts empty
        get_response = self.client.get('/api/reports', headers=self.auth_headers)
        get_body = get_response.get_json()
        self.assertEqual(get_response.status_code, 200)
        self.assertTrue(get_body['success'])
        self.assertEqual(len(get_body['data']['reports']), 0)

        # 2. Save a report
        save_response = self.client.post(
            '/api/reports',
            json={
                'scenario_id': 'bank-mitm',
                'scenario_name': 'Bank MITM',
                'risk_score_before': 90,
                'risk_score_after': 15,
            },
            headers=self.auth_headers,
        )
        save_body = save_response.get_json()
        self.assertEqual(save_response.status_code, 201)
        self.assertTrue(save_body['success'])
        self.assertEqual(save_body['data']['scenario_id'], 'bank-mitm')
        self.assertEqual(save_body['data']['risk_score_before'], 90)
        self.assertEqual(save_body['data']['risk_score_after'], 15)

        # 3. Retrieve reports list and check elements
        get_response2 = self.client.get('/api/reports', headers=self.auth_headers)
        get_body2 = get_response2.get_json()
        self.assertEqual(get_response2.status_code, 200)
        self.assertEqual(len(get_body2['data']['reports']), 1)
        retrieved_report = get_body2['data']['reports'][0]
        self.assertEqual(retrieved_report['scenario_name'], 'Bank MITM')
        self.assertEqual(retrieved_report['risk_score_before'], 90)
        self.assertEqual(retrieved_report['risk_score_after'], 15)

    def test_routes_require_authentication(self):
        # Without headers, POST should fail
        save_response = self.client.post(
            '/api/reports',
            json={
                'scenario_id': 'bank-mitm',
                'scenario_name': 'Bank MITM',
                'risk_score_before': 90,
                'risk_score_after': 15,
            },
        )
        self.assertEqual(save_response.status_code, 401)

        # Without headers, GET should fail
        get_response = self.client.get('/api/reports')
        self.assertEqual(get_response.status_code, 401)


if __name__ == '__main__':
    unittest.main()
