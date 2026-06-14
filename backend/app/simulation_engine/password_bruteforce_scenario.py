from app.auth.password_service import hash_password, password_matches


TARGET_USERNAME = 'student_operator'
TARGET_PASSWORD = 'SecurePass123'
PASSWORD_CANDIDATES = [
    'password123',
    'admin12345',
    'cyberlab2026',
    'SecurePass123',
]
LOCKOUT_THRESHOLD = 3


def build_password_bruteforce_state(scenario, defense_enabled=False, launched=True):
    if not launched:
        return build_standby_state(scenario, defense_enabled)

    target_hash = hash_password(TARGET_PASSWORD)
    attempts = build_attempts(target_hash, defense_enabled)
    successful_attempt = next((attempt for attempt in attempts if attempt['matched']), None)
    attack_success = successful_attempt is not None and not defense_enabled
    locked = defense_enabled and successful_attempt is None

    return {
        'scenario': scenario,
        'launched': launched,
        'defense_enabled': defense_enabled,
        'attack_success': attack_success,
        'channel': {
            'status': 'locked' if locked else 'compromised' if attack_success else 'monitoring',
            'label': 'Account Lockout Active' if locked else 'Credential Guessing Exposed' if attack_success else 'Credential Monitor',
            'algorithm': 'PBKDF2-SHA256 hash check',
        },
        'metrics': build_metrics(attempts, attack_success, locked),
        'packets': build_packets(attempts, locked),
        'alerts': build_alerts(attack_success, locked),
        'attack_logs': build_attack_logs(attempts, attack_success, locked),
        'defense_logs': build_defense_logs(attempts, defense_enabled, locked),
        'defenses': build_defenses(defense_enabled, locked),
    }


def build_attempts(target_hash, defense_enabled):
    attempts = []

    for index, candidate in enumerate(PASSWORD_CANDIDATES, start=1):
        if defense_enabled and index > LOCKOUT_THRESHOLD:
            break

        matched = password_matches(target_hash, candidate)
        attempts.append(
            {
                'attempt': index,
                'username': TARGET_USERNAME,
                'candidate': candidate,
                'matched': matched,
                'status': 'accepted' if matched else 'rejected',
            }
        )

        if matched:
            break

    return attempts


def build_standby_state(scenario, defense_enabled):
    return {
        'scenario': scenario,
        'launched': False,
        'defense_enabled': defense_enabled,
        'attack_success': False,
        'channel': {
            'status': 'standby',
            'label': 'Credential Simulation Standby',
            'algorithm': 'PBKDF2-SHA256 hash check',
        },
        'metrics': [
            {'label': 'Login Attempts', 'value': '00', 'trend': 'waiting for launch', 'tone': 'blue'},
            {'label': 'Hash Checks', 'value': '00', 'trend': 'idle', 'tone': 'green'},
            {'label': 'Account Status', 'value': 'OK', 'trend': 'no active attack', 'tone': 'green'},
            {'label': 'Alert Priority', 'value': 'P3', 'trend': 'standby', 'tone': 'yellow'},
        ],
        'packets': [],
        'alerts': [],
        'attack_logs': ['[standby] Password brute-force scenario is paused'],
        'defense_logs': ['[standby] Authentication monitor waiting for simulation launch'],
        'defenses': build_defenses(defense_enabled, locked=False),
    }


def build_metrics(attempts, attack_success, locked):
    return [
        {'label': 'Login Attempts', 'value': f'{len(attempts):02d}', 'trend': 'dictionary candidates tested', 'tone': 'red'},
        {'label': 'Hash Checks', 'value': f'{len(attempts):02d}', 'trend': 'PBKDF2 comparisons', 'tone': 'blue'},
        {
            'label': 'Account Status',
            'value': 'LOCK' if locked else 'OPEN',
            'trend': 'lockout triggered' if locked else 'credential exposed' if attack_success else 'monitoring',
            'tone': 'green' if locked else 'red' if attack_success else 'yellow',
        },
        {'label': 'Alert Priority', 'value': 'P2' if locked else 'P1' if attack_success else 'P3', 'trend': 'credential attack', 'tone': 'yellow'},
    ]


def build_packets(attempts, locked):
    packets = []

    for attempt in attempts:
        packets.append(
            {
                'id': f"login-{attempt['attempt']:03d}",
                'time': f"10:12:{10 + attempt['attempt']:02d}",
                'source': 'Attacker',
                'target': 'Auth Server',
                'protocol': 'HTTPS Login',
                'status': attempt['status'],
                'readable': True,
                'intercepted': attempt['matched'] or attempt['attempt'] == len(attempts),
                'payload_preview': f"user={attempt['username']} password={attempt['candidate']}",
            }
        )

    if locked:
        packets.append(
            {
                'id': 'lockout-001',
                'time': '10:12:14',
                'source': 'Auth Server',
                'target': 'Defender Console',
                'protocol': 'Security Event',
                'status': 'locked',
                'readable': True,
                'intercepted': False,
                'payload_preview': f'Account {TARGET_USERNAME} locked after {LOCKOUT_THRESHOLD} failed attempts',
            }
        )

    return packets


def build_alerts(attack_success, locked):
    if locked:
        return [
            {'time': '10:12:14', 'title': 'Account lockout triggered', 'severity': 'High'},
            {'time': '10:12:13', 'title': 'Repeated failed login attempts detected', 'severity': 'Medium'},
            {'time': '10:12:11', 'title': 'Password guessing pattern observed', 'severity': 'Medium'},
        ]

    if attack_success:
        return [
            {'time': '10:12:14', 'title': 'Credential guessed successfully', 'severity': 'Critical'},
            {'time': '10:12:13', 'title': 'Multiple failed attempts before success', 'severity': 'High'},
            {'time': '10:12:11', 'title': 'Dictionary attack started', 'severity': 'Medium'},
        ]

    return [
        {'time': '10:12:11', 'title': 'Credential monitor active', 'severity': 'Low'},
    ]


def build_attack_logs(attempts, attack_success, locked):
    logs = ['[10:12:10] Loaded dictionary with candidate passwords']

    for attempt in attempts:
        outcome = 'MATCH' if attempt['matched'] else 'rejected'
        logs.append(f"[10:12:{10 + attempt['attempt']:02d}] Attempt {attempt['attempt']}: {attempt['candidate']} -> {outcome}")

    if locked:
        logs.append('[10:12:14] Attack outcome: account locked before password discovery')
    elif attack_success:
        logs.append(f'[10:12:14] Attack outcome: credential recovered for {TARGET_USERNAME}')
    else:
        logs.append('[10:12:14] Attack outcome: no valid credential found')

    return logs


def build_defense_logs(attempts, defense_enabled, locked):
    if defense_enabled:
        logs = [
            '[10:12:10] Authentication monitor online',
            '[10:12:11] Failed-login counter armed',
        ]
        logs.extend(
            f"[10:12:{10 + attempt['attempt']:02d}] Hash check failed; counter={attempt['attempt']}"
            for attempt in attempts
            if not attempt['matched']
        )
        if locked:
            logs.append(f'[10:12:14] Lockout policy enforced for {TARGET_USERNAME}')

        return logs

    return [
        '[10:12:10] Authentication monitor online',
        '[10:12:11] Lockout policy inactive',
        f'[10:12:14] Password hash matched after {len(attempts)} attempts',
        '[10:12:15] Alert P1 raised for compromised credential',
    ]


def build_defenses(defense_enabled, locked):
    return [
        {'name': 'Password Hashing', 'status': 'Active', 'tone': 'green'},
        {'name': 'Account Lockout', 'status': 'Locked' if locked else 'Ready' if defense_enabled else 'Inactive', 'tone': 'green' if locked else 'yellow'},
        {'name': 'Rate Limiting', 'status': 'Active' if defense_enabled else 'Inactive', 'tone': 'green' if defense_enabled else 'yellow'},
        {'name': 'Login Alerting', 'status': 'Raised' if locked else 'Raised' if not defense_enabled else 'Monitoring', 'tone': 'yellow'},
    ]

