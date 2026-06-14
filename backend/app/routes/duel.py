"""
routes/duel.py
REST endpoints for duel room management (create, join, state, catalogues).
Real-time combat is handled by Socket.IO events in realtime/duel_events.py.
"""
from flask import Blueprint, g, request

from app.auth import require_auth
from app.simulation_engine.duel_engine import (
    create_room,
    get_catalogues,
    get_room_state,
    join_room,
    set_ready,
)
from app.utils.errors import ApiError
from app.utils.responses import success_response

duel_bp = Blueprint('duel', __name__)


@duel_bp.post('/rooms')
@require_auth
def create_duel_room():
    """Create a new duel room. Returns the room_code."""
    body = request.get_json(silent=True) or {}
    scenario_id = body.get('scenario_id', 'bank-mitm')
    room_code = create_room(scenario_id=scenario_id)
    return success_response('Duel room created', data={'room_code': room_code})


@duel_bp.post('/rooms/<room_code>/join')
@require_auth
def join_duel_room(room_code):
    """Join an existing room as attacker or defender."""
    user = g.current_user
    try:
        result = join_room(
            room_code=room_code.upper(),
            user_id=user['id'],
            username=user['username'],
            sid='',  # sid is updated when the Socket.IO connect fires
        )
    except ValueError as exc:
        raise ApiError(str(exc), 400) from exc
    return success_response('Joined room', data=result)


@duel_bp.post('/rooms/<room_code>/ready')
@require_auth
def mark_ready(room_code):
    """Mark the current user as ready for the duel."""
    user = g.current_user
    try:
        result = set_ready(room_code=room_code.upper(), user_id=user['id'])
    except ValueError as exc:
        raise ApiError(str(exc), 400) from exc
    return success_response('Ready status updated', data=result)


@duel_bp.get('/rooms/<room_code>')
@require_auth
def room_state(room_code):
    """Get current room state."""
    try:
        state = get_room_state(room_code.upper())
    except ValueError as exc:
        raise ApiError(str(exc), 404) from exc
    return success_response('Room state loaded', data={'room': state})


@duel_bp.get('/catalogues')
@require_auth
def catalogues():
    """Return the attack and defense catalogues."""
    return success_response('Catalogues loaded', data=get_catalogues())
