from flask import Blueprint, g, request

from app.auth import require_auth
from app.simulation_engine.scoring_engine import award_xp, get_score, get_leaderboard
from app.utils.responses import success_response
from app.utils.errors import ApiError

scoring_bp = Blueprint('scoring', __name__)

VALID_EVENTS = {'launch', 'defend', 'report_exported', 'scenario_completed'}


@scoring_bp.get('/me')
@require_auth
def my_score():
    score = get_score(g.current_user['id'])
    return success_response('Score loaded', data={'score': score})


@scoring_bp.get('/leaderboard')
@require_auth
def leaderboard():
    board = get_leaderboard()
    return success_response('Leaderboard loaded', data={'leaderboard': board})


@scoring_bp.post('/event')
@require_auth
def record_event():
    body = request.get_json(silent=True) or {}
    event_type = body.get('event_type', '')

    if event_type not in VALID_EVENTS:
        raise ApiError(f"Invalid event_type. Must be one of: {', '.join(VALID_EVENTS)}", 400)

    updated_score = award_xp(g.current_user['id'], event_type)
    return success_response('XP awarded', data={'score': updated_score})
