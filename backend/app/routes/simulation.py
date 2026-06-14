from flask import Blueprint, request

from app.simulation_engine import list_scenarios, run_simulation
from app.utils.responses import success_response


simulation_bp = Blueprint('simulation', __name__)


def json_body():
    body = request.get_json(silent=True)
    if body is None:
        return {}

    if not isinstance(body, dict):
        raise ValueError('Request body must be a JSON object.')

    return body


@simulation_bp.get('/scenarios')
def scenarios():
    return success_response('Simulation scenarios loaded', data=list_scenarios())


@simulation_bp.post('/simulations/run')
def run():
    body = json_body()
    scenario_id = body.get('scenario_id', 'bank-mitm')
    result = run_simulation(
        scenario_id=scenario_id,
        defense_enabled=body.get('defense_enabled', False),
        launched=body.get('launched', True),
    )
    return success_response('Simulation generated', data=result)

