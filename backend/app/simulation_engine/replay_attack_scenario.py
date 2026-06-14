from app.crypto_engine import sha256_digest


ORIGINAL_REQUEST = {
    'transaction_id': 'PAY-884291',
    'account': 'ACCT-7721',
    'merchant': 'MERCHANT-450',
    'amount': '2450 PKR',
    'nonce': 'nonce-20260527-884291',
    'session_id': 'sess-bank-7391',
}


def build_replay_attack_state(scenario, defense_enabled=False, launched=True):
    if not launched:
        return build_standby_state(scenario, defense_enabled)

    replay_accepted = not defense_enabled
    original_fingerprint = fingerprint_request(ORIGINAL_REQUEST)
    replay_fingerprint = fingerprint_request(ORIGINAL_REQUEST)

    packets = build_packets(replay_accepted, original_fingerprint, replay_fingerprint)

    return {
        'scenario': scenario,
        'launched': launched,
        'defense_enabled': defense_enabled,
        'attack_success': replay_accepted,
        'channel': {
            'status': 'replayed' if replay_accepted else 'rejected',
            'label': 'Replay Accepted' if replay_accepted else 'Replay Blocked',
            'algorithm': 'Nonce/session replay detection' if defense_enabled else 'None',
        },
        'metrics': build_metrics(replay_accepted),
        'packets': packets,
        'alerts': build_alerts(replay_accepted),
        'attack_logs': build_attack_logs(replay_accepted, replay_fingerprint),
        'defense_logs': build_defense_logs(replay_accepted, original_fingerprint),
        'defenses': build_defenses(defense_enabled, replay_accepted),
    }


def build_standby_state(scenario, defense_enabled):
    return {
        'scenario': scenario,
        'launched': False,
        'defense_enabled': defense_enabled,
        'attack_success': False,
        'channel': {
            'status': 'standby',
            'label': 'Replay Simulation Standby',
            'algorithm': 'Nonce/session replay detection ready' if defense_enabled else 'None',
        },
        'metrics': [
            {'label': 'Captured Requests', 'value': '00', 'trend': 'waiting for launch', 'tone': 'blue'},
            {'label': 'Replay Attempts', 'value': '00', 'trend': 'idle', 'tone': 'red'},
            {'label': 'Nonce Checks', 'value': '00', 'trend': 'standby', 'tone': 'green'},
            {'label': 'Alert Priority', 'value': 'P3', 'trend': 'standby', 'tone': 'yellow'},
        ],
        'packets': [],
        'alerts': [],
        'attack_logs': ['[standby] Replay attack scenario is paused'],
        'defense_logs': ['[standby] Session monitor waiting for replay traffic'],
        'defenses': build_defenses(defense_enabled, replay_accepted=False),
    }


def build_packets(replay_accepted, original_fingerprint, replay_fingerprint):
    replay_status = 'accepted' if replay_accepted else 'rejected'
    replay_preview = (
        f"REPLAY transaction={ORIGINAL_REQUEST['transaction_id']} nonce={ORIGINAL_REQUEST['nonce']} fingerprint={replay_fingerprint['digest'][:18]}"
    )

    return [
        {
            'id': 'replay-001',
            'time': '12:18:10',
            'source': 'Client',
            'target': 'Payment Gateway',
            'protocol': 'HTTPS',
            'status': 'accepted',
            'readable': True,
            'intercepted': False,
            'payload_preview': (
                f"ORIGINAL transaction={ORIGINAL_REQUEST['transaction_id']} amount={ORIGINAL_REQUEST['amount']} "
                f"nonce={ORIGINAL_REQUEST['nonce']} fingerprint={original_fingerprint['digest'][:18]}"
            ),
        },
        {
            'id': 'replay-002',
            'time': '12:18:12',
            'source': 'Attacker Capture',
            'target': 'Replay Buffer',
            'protocol': 'Packet Copy',
            'status': 'captured',
            'readable': True,
            'intercepted': True,
            'payload_preview': f"Captured valid request with nonce={ORIGINAL_REQUEST['nonce']}",
        },
        {
            'id': 'replay-003',
            'time': '12:18:16',
            'source': 'Attacker Replay',
            'target': 'Payment Gateway',
            'protocol': 'HTTPS',
            'status': replay_status,
            'readable': True,
            'intercepted': True,
            'payload_preview': replay_preview,
        },
    ]


def build_metrics(replay_accepted):
    return [
        {'label': 'Captured Requests', 'value': '01', 'trend': 'valid packet reused', 'tone': 'red'},
        {'label': 'Replay Attempts', 'value': '01', 'trend': 'duplicate request sent', 'tone': 'red'},
        {'label': 'Nonce Checks', 'value': '00' if replay_accepted else '01', 'trend': 'inactive' if replay_accepted else 'duplicate nonce blocked', 'tone': 'green'},
        {'label': 'Alert Priority', 'value': 'P1' if replay_accepted else 'P2', 'trend': 'payment duplicated' if replay_accepted else 'replay rejected', 'tone': 'yellow'},
    ]


def build_alerts(replay_accepted):
    if replay_accepted:
        return [
            {'time': '12:18:16', 'title': 'Duplicate payment request accepted', 'severity': 'Critical'},
            {'time': '12:18:12', 'title': 'Valid request copied to replay buffer', 'severity': 'High'},
            {'time': '12:18:10', 'title': 'Reusable transaction packet observed', 'severity': 'Medium'},
        ]

    return [
        {'time': '12:18:16', 'title': 'Duplicate nonce rejected by gateway', 'severity': 'High'},
        {'time': '12:18:12', 'title': 'Replay buffer activity detected', 'severity': 'Medium'},
        {'time': '12:18:10', 'title': 'Original request fingerprint stored', 'severity': 'Low'},
    ]


def build_attack_logs(replay_accepted, replay_fingerprint):
    logs = [
        '[12:18:10] Captured valid payment request from client session',
        f"[12:18:12] Stored packet copy with nonce={ORIGINAL_REQUEST['nonce']}",
        f"[12:18:16] Replayed request fingerprint={replay_fingerprint['digest'][:24]}",
    ]

    logs.append('[12:18:17] Attack outcome: duplicate transaction accepted' if replay_accepted else '[12:18:17] Attack outcome: replay rejected by nonce/session validation')
    return logs


def build_defense_logs(replay_accepted, original_fingerprint):
    if replay_accepted:
        return [
            '[12:18:10] Payment gateway accepted original request',
            '[12:18:12] Nonce ledger inactive for this session',
            '[12:18:16] Duplicate nonce was not checked',
            '[12:18:17] Alert P1 raised for repeated transaction execution',
        ]

    return [
        '[12:18:10] Payment gateway accepted original request',
        f"[12:18:11] Stored request fingerprint={original_fingerprint['digest'][:24]}",
        f"[12:18:16] Duplicate nonce detected: {ORIGINAL_REQUEST['nonce']}",
        '[12:18:17] Alert P2 raised; replay blocked before payment execution',
    ]


def build_defenses(defense_enabled, replay_accepted):
    return [
        {'name': 'Nonce Protection', 'status': 'Active' if defense_enabled else 'Inactive', 'tone': 'green' if defense_enabled else 'yellow'},
        {'name': 'Session Binding', 'status': 'Verified' if defense_enabled else 'Inactive', 'tone': 'green' if defense_enabled else 'yellow'},
        {'name': 'Request Fingerprint', 'status': 'Stored' if defense_enabled else 'Skipped', 'tone': 'green' if defense_enabled else 'yellow'},
        {'name': 'Replay Monitor', 'status': 'Rejected' if not replay_accepted else 'Missed', 'tone': 'green' if not replay_accepted else 'red'},
    ]


def fingerprint_request(request_payload):
    canonical = '|'.join(f'{key}={request_payload[key]}' for key in sorted(request_payload))
    return sha256_digest(canonical)

