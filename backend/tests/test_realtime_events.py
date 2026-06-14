import unittest

from app import create_app
from app.extensions import socketio


class RealtimeEventTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True})
        self.client = socketio.test_client(self.app)

    def tearDown(self):
        self.client.disconnect()

    def test_connect_emits_realtime_status(self):
        received = self.client.get_received()
        status_events = [event for event in received if event['name'] == 'realtime:status']

        self.assertTrue(self.client.is_connected())
        self.assertEqual(len(status_events), 1)
        self.assertTrue(status_events[0]['args'][0]['connected'])

    def test_simulation_start_streams_state_and_events(self):
        ack = self.client.emit(
            'simulation:start',
            {
                'scenario_id': 'bank-mitm',
                'defense_enabled': True,
                'launched': True,
            },
            callback=True,
        )
        received = self.client.get_received()
        state_events = [event for event in received if event['name'] == 'simulation:state']
        stream_events = [event for event in received if event['name'] == 'simulation:event']

        self.assertTrue(ack['success'])
        self.assertEqual(ack['data']['scenario_id'], 'bank-mitm')
        self.assertEqual(len(state_events), 1)
        self.assertGreater(len(stream_events), 1)
        self.assertFalse(state_events[0]['args'][0]['attack_success'])
        self.assertEqual(state_events[0]['args'][0]['channel']['algorithm'], 'AES-256-GCM')

    def test_password_bruteforce_streams_lockout_state(self):
        ack = self.client.emit(
            'simulation:start',
            {
                'scenario_id': 'password-bruteforce',
                'defense_enabled': True,
                'launched': True,
            },
            callback=True,
        )
        received = self.client.get_received()
        state_events = [event for event in received if event['name'] == 'simulation:state']
        stream_events = [event for event in received if event['name'] == 'simulation:event']

        self.assertTrue(ack['success'])
        self.assertEqual(ack['data']['scenario_id'], 'password-bruteforce')
        self.assertEqual(state_events[-1]['args'][0]['channel']['status'], 'locked')
        self.assertGreater(len(stream_events), 1)

    def test_packet_sniffing_streams_protected_state(self):
        ack = self.client.emit(
            'simulation:start',
            {
                'scenario_id': 'packet-sniffing',
                'defense_enabled': True,
                'launched': True,
            },
            callback=True,
        )
        received = self.client.get_received()
        state_events = [event for event in received if event['name'] == 'simulation:state']
        stream_events = [event for event in received if event['name'] == 'simulation:event']

        self.assertTrue(ack['success'])
        self.assertEqual(ack['data']['scenario_id'], 'packet-sniffing')
        self.assertEqual(state_events[-1]['args'][0]['channel']['status'], 'protected')
        self.assertGreater(len(stream_events), 1)

    def test_replay_attack_streams_rejected_state(self):
        ack = self.client.emit(
            'simulation:start',
            {
                'scenario_id': 'replay-attack',
                'defense_enabled': True,
                'launched': True,
            },
            callback=True,
        )
        received = self.client.get_received()
        state_events = [event for event in received if event['name'] == 'simulation:state']
        stream_events = [event for event in received if event['name'] == 'simulation:event']

        self.assertTrue(ack['success'])
        self.assertEqual(ack['data']['scenario_id'], 'replay-attack')
        self.assertEqual(state_events[-1]['args'][0]['channel']['status'], 'rejected')
        self.assertGreater(len(stream_events), 1)


if __name__ == '__main__':
    unittest.main()
