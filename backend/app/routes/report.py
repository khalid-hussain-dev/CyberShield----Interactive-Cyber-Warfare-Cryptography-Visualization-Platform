from flask import Blueprint, g, request

from app.auth import require_auth
from app.simulation_engine.report_repository import create_report, get_user_reports
from app.simulation_engine.blockchain_engine import mine_block
from app.utils.responses import success_response



report_bp = Blueprint('report', __name__)


def json_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ValueError('Request body must be a JSON object.')

    return body


def required(body, field_name):
    value = body.get(field_name)
    if value is None or value == '':
        raise ValueError(f'Missing required field: {field_name}')

    return value


@report_bp.post('')
@require_auth
def save_report():
    body = json_body()
    user_id = g.current_user['id']
    scenario_id = required(body, 'scenario_id')
    scenario_name = required(body, 'scenario_name')
    risk_score_before = required(body, 'risk_score_before')
    risk_score_after = required(body, 'risk_score_after')

    report = create_report(
        user_id=user_id,
        scenario_id=scenario_id,
        scenario_name=scenario_name,
        risk_score_before=risk_score_before,
        risk_score_after=risk_score_after,
    )

    # Append to immutable blockchain audit chain (non-blocking)
    try:
        mine_block(user_id, {
            'report_id': report['id'],
            'scenario_id': scenario_id,
            'scenario_name': scenario_name,
            'risk_score_before': int(risk_score_before),
            'risk_score_after': int(risk_score_after),
        })
    except Exception:
        pass  # Blockchain failure must never break the report save

    return success_response('Audit log saved successfully', data=report, status_code=201)



@report_bp.get('')
@require_auth
def list_reports():
    user_id = g.current_user['id']
    reports = get_user_reports(user_id)
    return success_response('Audit logs loaded successfully', data={'reports': reports})
