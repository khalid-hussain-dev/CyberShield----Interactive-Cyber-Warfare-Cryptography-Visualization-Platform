from app.crypto_engine import encrypt_text_with_aes
from app.simulation_engine.scapy_forensics import build_forensic_packets


def build_packet_sniffing_state(scenario, defense_enabled=False, launched=True):
    if not launched:
        return build_standby_state(scenario, defense_enabled)

    packets = build_forensic_packets(defense_enabled=defense_enabled)
    exposed_packets = [packet for packet in packets if packet['readable']]
    attack_success = len(exposed_packets) > 0

    return {
        'scenario': scenario,
        'launched': launched,
        'defense_enabled': defense_enabled,
        'attack_success': attack_success,
        'channel': {
            'status': 'protected' if defense_enabled else 'exposed',
            'label': 'Encrypted Traffic' if defense_enabled else 'Plaintext Traffic',
            'algorithm': 'AES-256-GCM' if defense_enabled else 'None',
        },
        'metrics': build_metrics(packets, exposed_packets, defense_enabled),
        'packets': packets,
        'alerts': build_alerts(defense_enabled),
        'attack_logs': build_attack_logs(packets, defense_enabled),
        'defense_logs': build_defense_logs(packets, defense_enabled),
        'defenses': build_defenses(defense_enabled),
    }



def build_packets(defense_enabled):
    packets = []

    for packet in PLAINTEXT_PACKETS:
        encrypted = encrypt_text_with_aes(packet['payload']) if defense_enabled else None
        payload_preview = encrypted['ciphertext'][:56] if encrypted else packet['payload']
        packets.append(
            {
                'id': packet['id'],
                'time': packet['time'],
                'source': packet['source'],
                'target': packet['target'],
                'protocol': 'TLS' if defense_enabled else packet['protocol'],
                'status': 'encrypted_capture' if defense_enabled else 'captured',
                'readable': not defense_enabled,
                'intercepted': True,
                'payload_preview': payload_preview,
            }
        )

    return packets


def build_standby_state(scenario, defense_enabled):
    return {
        'scenario': scenario,
        'launched': False,
        'defense_enabled': defense_enabled,
        'attack_success': False,
        'channel': {
            'status': 'standby',
            'label': 'Traffic Capture Standby',
            'algorithm': 'AES-256-GCM ready' if defense_enabled else 'None',
        },
        'metrics': [
            {'label': 'Captured Packets', 'value': '000', 'trend': 'waiting for launch', 'tone': 'blue'},
            {'label': 'Readable Payloads', 'value': '000', 'trend': 'no capture active', 'tone': 'green'},
            {'label': 'Encrypted Flows', 'value': '000', 'trend': 'standby', 'tone': 'green'},
            {'label': 'Alert Priority', 'value': 'P3', 'trend': 'standby', 'tone': 'yellow'},
        ],
        'packets': [],
        'alerts': [],
        'attack_logs': ['[standby] Packet sniffing scenario is paused'],
        'defense_logs': ['[standby] Network monitor waiting for packet flow'],
        'defenses': build_defenses(defense_enabled),
    }


def build_metrics(packets, exposed_packets, defense_enabled):
    return [
        {'label': 'Captured Packets', 'value': f'{len(packets):03d}', 'trend': 'sniffer tap active', 'tone': 'red'},
        {'label': 'Readable Payloads', 'value': f'{len(exposed_packets):03d}', 'trend': 'visible to attacker' if exposed_packets else 'none exposed', 'tone': 'green' if defense_enabled else 'red'},
        {'label': 'Encrypted Flows', 'value': f'{len(packets) if defense_enabled else 0:03d}', 'trend': 'TLS/AES applied' if defense_enabled else 'not active', 'tone': 'blue'},
        {'label': 'Alert Priority', 'value': 'P2' if defense_enabled else 'P1', 'trend': 'encrypted capture' if defense_enabled else 'payload exposure', 'tone': 'yellow'},
    ]


def build_alerts(defense_enabled):
    if defense_enabled:
        return [
            {'time': '11:03:16', 'title': 'Sniffer captured encrypted traffic only', 'severity': 'Medium'},
            {'time': '11:03:13', 'title': 'TLS traffic observed on monitored segment', 'severity': 'Low'},
            {'time': '11:03:11', 'title': 'Packet capture interface detected', 'severity': 'Medium'},
        ]

    return [
        {'time': '11:03:16', 'title': 'Session token visible in packet capture', 'severity': 'Critical'},
        {'time': '11:03:13', 'title': 'File transfer metadata exposed', 'severity': 'High'},
        {'time': '11:03:11', 'title': 'Plaintext mail request captured', 'severity': 'Medium'},
    ]


def build_attack_logs(packets, defense_enabled):
    logs = ['[11:03:09] Sniffer interface attached to shared network segment']

    for packet in packets:
        if defense_enabled:
            logs.append(f"[{packet['time']}] Captured ciphertext from {packet['source']} -> {packet['target']}: {packet['payload_preview']}...")
        else:
            logs.append(f"[{packet['time']}] Captured plaintext from {packet['source']} -> {packet['target']}: {packet['payload_preview']}")

    logs.append('[11:03:18] Attack outcome: packet contents unreadable' if defense_enabled else '[11:03:18] Attack outcome: sensitive packet contents exposed')
    return logs


def build_defense_logs(packets, defense_enabled):
    if defense_enabled:
        return [
            '[11:03:09] Network defender activated encrypted transport policy',
            '[11:03:10] TLS tunnel established for client traffic',
            f'[11:03:16] {len(packets)} captured packets classified as encrypted flows',
            '[11:03:18] Alert P2 raised; sniffer sees ciphertext only',
        ]

    return [
        '[11:03:09] Network monitor online',
        '[11:03:10] Plaintext HTTP/FTP traffic detected',
        '[11:03:16] Sensitive token observed outside encrypted transport',
        '[11:03:18] Alert P1 raised for exposed packet contents',
    ]


def build_defenses(defense_enabled):
    return [
        {'name': 'TLS Transport', 'status': 'Active' if defense_enabled else 'Inactive', 'tone': 'green' if defense_enabled else 'yellow'},
        {'name': 'AES Payload Protection', 'status': 'Active' if defense_enabled else 'Ready', 'tone': 'green'},
        {'name': 'Packet Entropy Monitor', 'status': 'Raised' if defense_enabled else 'Raised', 'tone': 'yellow'},
        {'name': 'Sensitive Token Detection', 'status': 'Blocked' if defense_enabled else 'Exposed', 'tone': 'green' if defense_enabled else 'red'},
    ]

