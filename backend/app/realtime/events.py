from flask import request

from app.simulation_engine import run_simulation
from app.utils.errors import ApiError


def register_socket_events(socketio):
    @socketio.on('connect')
    def handle_connect():
        socketio.emit(
            'realtime:status',
            {
                'connected': True,
                'message': 'CyberShield realtime channel connected',
            },
            to=request.sid,
        )

    @socketio.on('simulation:start')
    def handle_simulation_start(payload=None):
        try:
            body = payload if isinstance(payload, dict) else {}
            state = run_simulation(
                scenario_id=body.get('scenario_id', 'bank-mitm'),
                defense_enabled=body.get('defense_enabled', False),
                launched=body.get('launched', True),
            )

            socketio.emit('simulation:state', state, to=request.sid)
            for event in state.get('event_stream', []):
                socketio.emit('simulation:event', event, to=request.sid)

            return {
                'success': True,
                'message': 'Simulation stream emitted',
                'data': {
                    'event_count': len(state.get('event_stream', [])),
                    'scenario_id': state['scenario']['id'],
                },
            }
        except ApiError as error:
            response = {
                'success': False,
                'message': error.message,
                'data': {},
            }
            socketio.emit('simulation:error', response, to=request.sid)
            return response
