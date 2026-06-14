SCENARIOS = [
    {
        'id': 'bank-mitm',
        'name': 'Bank Transaction Interception',
        'type': 'MITM',
        'status': 'Active',
        'risk': 'Critical',
        'target': 'Bank API',
        'description': 'Intercept a bank transaction before and after AES protection is applied.',
    },
    {
        'id': 'password-bruteforce',
        'name': 'Password Brute Force',
        'type': 'Credential Attack',
        'status': 'Active',
        'risk': 'High',
        'target': 'Auth Server',
        'description': 'Demonstrate password guessing and account lock response.',
    },
    {
        'id': 'packet-sniffing',
        'name': 'Packet Sniffing',
        'type': 'Capture',
        'status': 'Active',
        'risk': 'Medium',
        'target': 'Client Traffic',
        'description': 'Capture traffic and compare plaintext with encrypted packets.',
    },
    {
        'id': 'replay-attack',
        'name': 'Replay Attack',
        'type': 'Session Abuse',
        'status': 'Active',
        'risk': 'High',
        'target': 'Payment Gateway',
        'description': 'Reuse a captured request and block it with nonce/session protection.',
    },
]


def list_scenarios():
    return [scenario.copy() for scenario in SCENARIOS]


def find_scenario(scenario_id):
    for scenario in SCENARIOS:
        if scenario['id'] == scenario_id:
            return scenario.copy()

    return None
