"""
realtime/duel_events.py
Socket.IO event handlers for real-time duel gameplay.
Players connect, fire attacks, deploy defenses, and receive round results
all via WebSocket events in the 'duel' namespace.
"""
from flask import request
from flask_socketio import emit, join_room as sio_join_room

from app.simulation_engine.duel_engine import (
    get_catalogues,
    get_room_state,
    join_room,
    process_attack,
    process_defense,
    set_ready,
)
from app.simulation_engine.scoring_engine import award_xp


def register_duel_events(socketio):
    """Register all /duel namespace Socket.IO event handlers."""

    @socketio.on('connect', namespace='/duel')
    def duel_connect():
        emit('duel:connected', {'message': 'Duel channel ready'}, namespace='/duel')

    @socketio.on('duel:join', namespace='/duel')
    def duel_join(payload=None):
        """
        Payload: { room_code, token }
        Assigns player to room and broadcasts updated state.
        """
        body = payload or {}
        room_code = (body.get('room_code') or '').upper()
        token = body.get('token', '')

        # Validate token and get user
        user = _user_from_token(token)
        if user is None:
            emit('duel:error', {'message': 'Authentication failed'}, namespace='/duel')
            return

        try:
            result = join_room(
                room_code=room_code,
                user_id=user['id'],
                username=user['username'],
                sid=request.sid,
            )
        except ValueError as exc:
            emit('duel:error', {'message': str(exc)}, namespace='/duel')
            return

        sio_join_room(room_code, namespace='/duel')
        catalogues = get_catalogues()

        emit('duel:joined', {
            'role': result['role'],
            'room': result['room'],
            'catalogues': catalogues,
        }, namespace='/duel')

        # Notify other player(s) that someone joined
        socketio.emit('duel:player_joined', {
            'room': result['room'],
        }, to=room_code, namespace='/duel', skip_sid=request.sid)

    @socketio.on('duel:ready', namespace='/duel')
    def duel_ready(payload=None):
        """Player signals they are ready to start."""
        body = payload or {}
        room_code = (body.get('room_code') or '').upper()
        token = body.get('token', '')

        user = _user_from_token(token)
        if user is None:
            emit('duel:error', {'message': 'Authentication failed'}, namespace='/duel')
            return

        try:
            result = set_ready(room_code=room_code, user_id=user['id'])
        except ValueError as exc:
            emit('duel:error', {'message': str(exc)}, namespace='/duel')
            return

        socketio.emit('duel:state_update', {'room': result['room']},
                      to=room_code, namespace='/duel')

        if result['both_ready']:
            socketio.emit('duel:round_start', {
                'round': result['room']['current_round']['number'],
                'room': result['room'],
            }, to=room_code, namespace='/duel')

    @socketio.on('duel:attack', namespace='/duel')
    def duel_attack(payload=None):
        """Attacker fires an attack. Payload: { room_code, token, attack_type }"""
        body = payload or {}
        room_code = (body.get('room_code') or '').upper()
        token = body.get('token', '')
        attack_type = body.get('attack_type', '')

        user = _user_from_token(token)
        if user is None:
            emit('duel:error', {'message': 'Authentication failed'}, namespace='/duel')
            return

        try:
            result = process_attack(
                room_code=room_code,
                user_id=user['id'],
                attack_type=attack_type,
            )
        except ValueError as exc:
            emit('duel:error', {'message': str(exc)}, namespace='/duel')
            return

        # Broadcast attack lock-in
        socketio.emit('duel:attack_locked', {
            'attack_type': attack_type,
            'room': result['room'],
        }, to=room_code, namespace='/duel')

        _maybe_broadcast_round_result(socketio, room_code, result)

    @socketio.on('duel:defend', namespace='/duel')
    def duel_defend(payload=None):
        """Defender deploys a defense. Payload: { room_code, token, defense_type }"""
        body = payload or {}
        room_code = (body.get('room_code') or '').upper()
        token = body.get('token', '')
        defense_type = body.get('defense_type', '')

        user = _user_from_token(token)
        if user is None:
            emit('duel:error', {'message': 'Authentication failed'}, namespace='/duel')
            return

        try:
            result = process_defense(
                room_code=room_code,
                user_id=user['id'],
                defense_type=defense_type,
            )
        except ValueError as exc:
            emit('duel:error', {'message': str(exc)}, namespace='/duel')
            return

        socketio.emit('duel:defense_locked', {
            'defense_type': defense_type,
            'room': result['room'],
        }, to=room_code, namespace='/duel')

        _maybe_broadcast_round_result(socketio, room_code, result)

    @socketio.on('duel:state', namespace='/duel')
    def duel_state_request(payload=None):
        """Return current room state to the requesting client."""
        body = payload or {}
        room_code = (body.get('room_code') or '').upper()
        try:
            state = get_room_state(room_code)
            emit('duel:state_update', {'room': state}, namespace='/duel')
        except ValueError as exc:
            emit('duel:error', {'message': str(exc)}, namespace='/duel')


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _maybe_broadcast_round_result(socketio, room_code: str, result: dict):
    """If the round resolved, broadcast result and handle game-over XP awards."""
    if not result.get('resolved'):
        return

    socketio.emit('duel:round_result', {
        'breach_success': result['breach_success'],
        'attack_type': result['attack_type'],
        'defense_type': result['defense_type'],
        'attacker_earned': result['attacker_earned'],
        'defender_earned': result['defender_earned'],
        'round_number': result['round_number'],
        'game_over': result['game_over'],
        'winner_role': result.get('winner_role'),
        'room': result['room'],
    }, to=room_code, namespace='/duel')

    if result['game_over']:
        _award_duel_xp(result)
        socketio.emit('duel:game_over', {
            'winner_role': result.get('winner_role'),
            'room': result['room'],
        }, to=room_code, namespace='/duel')
    else:
        # Next round
        socketio.emit('duel:round_start', {
            'round': result['room']['current_round']['number'],
            'room': result['room'],
        }, to=room_code, namespace='/duel')


def _award_duel_xp(result: dict):
    """Award bonus XP to both players for completing a duel."""
    room = result['room']
    attacker = room.get('attacker')
    defender = room.get('defender')
    winner_role = result.get('winner_role')

    # Base completion XP for both players
    for player in [attacker, defender]:
        if player:
            award_xp(player['user_id'], 'scenario_completed')

    # Bonus XP for winner (50 XP)
    if winner_role == 'attacker' and attacker:
        award_xp(attacker['user_id'], 'duel_winner')
    elif winner_role == 'defender' and defender:
        award_xp(defender['user_id'], 'duel_winner')


def _user_from_token(token: str):
    """Validate a JWT token and return user dict, or None on failure."""
    from app.auth.token_service import decode_access_token
    from app.auth.auth_service import get_user_profile
    try:
        payload = decode_access_token(token)
        user_id = payload.get('sub')
        if user_id is None:
            return None
        return get_user_profile(user_id)
    except Exception:
        return None
