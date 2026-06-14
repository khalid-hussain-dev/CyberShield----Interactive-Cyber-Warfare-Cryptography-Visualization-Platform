from app.simulation_engine.event_stream import build_event_stream
from app.simulation_engine.bank_mitm_scenario import build_bank_mitm_state
from app.simulation_engine.packet_sniffing_scenario import build_packet_sniffing_state
from app.simulation_engine.password_bruteforce_scenario import build_password_bruteforce_state
from app.simulation_engine.replay_attack_scenario import build_replay_attack_state
from app.simulation_engine.scenario_catalog import find_scenario, list_scenarios as catalog_scenarios
from app.utils.errors import ApiError


SCENARIO_BUILDERS = {
    'bank-mitm': build_bank_mitm_state,
    'packet-sniffing': build_packet_sniffing_state,
    'password-bruteforce': build_password_bruteforce_state,
    'replay-attack': build_replay_attack_state,
}


def list_scenarios():
    return {
        'scenarios': catalog_scenarios(),
    }


def run_simulation(scenario_id, defense_enabled=False, launched=True):
    scenario = find_scenario(scenario_id)

    if scenario is None:
        raise ApiError('Simulation scenario not found.', status_code=404)

    builder = SCENARIO_BUILDERS.get(scenario_id)
    if builder:
        return attach_event_stream(builder(scenario, defense_enabled=bool(defense_enabled), launched=bool(launched)))

    return attach_event_stream(build_planned_state(scenario))


def attach_event_stream(state):
    state['event_stream'] = build_event_stream(state)
    return state


def build_planned_state(scenario):
    return {
        'scenario': scenario,
        'launched': False,
        'defense_enabled': False,
        'attack_success': False,
        'channel': {
            'status': 'planned',
            'label': 'Scenario Planned',
            'algorithm': 'Pending implementation',
        },
        'metrics': [
            {'label': 'Active Attacks', 'value': '00', 'trend': 'not implemented yet', 'tone': 'blue'},
            {'label': 'Protected Channels', 'value': '00', 'trend': 'pending module', 'tone': 'green'},
            {'label': 'Packets Observed', 'value': '000', 'trend': 'no generated packets', 'tone': 'blue'},
            {'label': 'Alert Priority', 'value': 'P3', 'trend': 'planned scenario', 'tone': 'yellow'},
        ],
        'packets': [],
        'alerts': [
            {'time': '--:--:--', 'title': f"{scenario['name']} is queued for a later stage", 'severity': 'Medium'},
        ],
        'attack_logs': [f"[planned] {scenario['name']} simulation engine is not wired yet"],
        'defense_logs': ['[planned] Defense workflow pending for this scenario'],
        'defenses': [
            {'name': 'AES-256 Encryption', 'status': 'Ready', 'tone': 'green'},
            {'name': 'RSA Key Exchange', 'status': 'Ready', 'tone': 'blue'},
            {'name': 'Digital Signatures', 'status': 'Standby', 'tone': 'yellow'},
            {'name': 'Nonce Protection', 'status': 'Standby', 'tone': 'yellow'},
        ],
    }
