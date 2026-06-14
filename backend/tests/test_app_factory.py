import unittest

from app import create_app


class AppFactoryTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app({'TESTING': True}).test_client()

    def test_health_response_uses_standard_shape(self):
        response = self.client.get('/api/health')
        body = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(body['success'])
        self.assertEqual(body['message'], 'CyberShield backend is online')
        self.assertEqual(body['data']['status'], 'ok')

    def test_root_response_points_to_api_routes(self):
        response = self.client.get('/')
        body = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['health'], '/api/health')
        self.assertEqual(body['data']['auth'], '/api/auth')

    def test_unknown_route_uses_standard_error_shape(self):
        response = self.client.get('/api/missing')
        body = response.get_json()

        self.assertEqual(response.status_code, 404)
        self.assertFalse(body['success'])
        self.assertEqual(body['message'], 'Endpoint not found')


if __name__ == '__main__':
    unittest.main()
