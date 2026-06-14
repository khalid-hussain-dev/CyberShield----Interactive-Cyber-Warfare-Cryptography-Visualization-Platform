from flask import Blueprint, g, request

from app.auth import require_auth
from app.simulation_engine.ids_engine import classify_traffic
from app.utils.responses import success_response
from app.utils.errors import ApiError

ids_bp = Blueprint('ids', __name__)


@ids_bp.post('/analyze')
@require_auth
def analyze(_current_user=None):
    body = request.get_json(silent=True) or {}
    packets = body.get('packets', [])

    if not isinstance(packets, list):
        raise ApiError('packets must be a JSON array', 400)

    if len(packets) > 100:
        raise ApiError('Maximum 100 packets per request', 400)

    results = classify_traffic(packets)
    summary = {
        'total': len(results),
        'normal': sum(1 for r in results if r['label'] == 'Normal'),
        'suspicious': sum(1 for r in results if r['label'] == 'Suspicious'),
        'attack': sum(1 for r in results if r['label'] == 'Attack'),
    }
    return success_response('IDS analysis complete', data={'results': results, 'summary': summary})
