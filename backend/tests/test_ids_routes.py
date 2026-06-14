import tempfile
import unittest
from pathlib import Path

from app import create_app


class IdsRouteTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = str(Path(self.temp_dir.name) / 'ids-test.sqlite')
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
                'username': 'operator_ids',
                'email': 'ids@example.com',
                'password': 'SecurePass123',
            },
        )
        self.token = register_response.get_json()['data']['access_token']
        self.auth_headers = {'Authorization': f'Bearer {self.token}'}

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_ids_analysis(self):
        # 1. Analyze packets (some benign, some suspicious)
        packets = [
            {
                'packet_size': 500,
                'inter_arrival_ms': 100,
                'protocol': 'TCP',
                'dst_port': 80,
                'payload_preview': 'GET /index.html HTTP/1.1',
            },
            {
                'packet_size': 10,
                'inter_arrival_ms': 1,
                'protocol': 'TCP',
                'dst_port': 31337,
                'payload_preview': '\x90\x90\x90\x90\xeb\x0e',
            }
        ]

        response = self.client.post(
            '/api/ids/analyze',
            json={'packets': packets},
            headers=self.auth_headers,
        )
        body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['summary']['total'], 2)
        results = body['data']['results']
        self.assertEqual(len(results), 2)
        # Check that features are correctly extracted and returned
        self.assertIn('label', results[0])
        self.assertIn('confidence', results[0])
        self.assertIn('anomaly_score', results[0])
        self.assertEqual(results[0]['features']['packet_size'], 500)


if __name__ == '__main__':
    unittest.main()
