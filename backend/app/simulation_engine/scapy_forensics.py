"""
Scapy Forensics Module — offline PCAP simulation (no admin/root required).

Builds an in-memory packet trace using scapy layer objects, then dissects
them to produce rich forensic output: layer summaries, TTL, flags,
Shannon entropy per payload. Falls back to enriched static packets if
scapy is not installed.
"""

import math
import random

try:
    from scapy.layers.inet import IP, TCP, UDP
    from scapy.layers.l2 import Ether
    from scapy.packet import Raw
    _SCAPY_AVAILABLE = True
except ImportError:
    _SCAPY_AVAILABLE = False


def _shannon_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    freq = {}
    for b in data:
        freq[b] = freq.get(b, 0) + 1
    n = len(data)
    return -sum((c / n) * math.log2(c / n) for c in freq.values())


def _build_scapy_packets(defense_enabled: bool) -> list:
    """Build a realistic in-memory PCAP trace using scapy layers."""
    rng = random.Random(7)
    raw_packets = []

    traffic_specs = [
        {
            'src_ip': '192.168.1.10', 'dst_ip': '10.0.0.5',
            'sport': rng.randint(49152, 65535), 'dport': 80,
            'proto': 'TCP', 'flags': 'PA',
            'payload': b'GET /account/balance HTTP/1.1\r\nHost: bank.internal\r\nAuthorization: Bearer demo-token-8842\r\n',
            'label': 'HTTP Banking Request',
        },
        {
            'src_ip': '192.168.1.10', 'dst_ip': '10.0.0.5',
            'sport': rng.randint(49152, 65535), 'dport': 21,
            'proto': 'TCP', 'flags': 'PA',
            'payload': b'USER student_operator\r\nPASS lab_password_2024\r\n',
            'label': 'FTP Credentials',
        },
        {
            'src_ip': '192.168.1.10', 'dst_ip': '8.8.8.8',
            'sport': rng.randint(49152, 65535), 'dport': 53,
            'proto': 'UDP', 'flags': None,
            'payload': b'\x12\x34\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00\x03api\x05local\x00',
            'label': 'DNS Query',
        },
        {
            'src_ip': '192.168.1.99', 'dst_ip': '192.168.1.10',
            'sport': 4444, 'dport': rng.randint(49152, 65535),
            'proto': 'TCP', 'flags': 'PA',
            'payload': b'\x90\x90\x90\x90\xcc\xcc\xeb\x0e' + bytes(rng.getrandbits(8) for _ in range(48)),
            'label': 'Suspicious Binary',
        },
    ]

    for spec in traffic_specs:
        if _SCAPY_AVAILABLE:
            if spec['proto'] == 'TCP':
                pkt = (
                    Ether()
                    / IP(src=spec['src_ip'], dst=spec['dst_ip'], ttl=rng.randint(32, 128))
                    / TCP(sport=spec['sport'], dport=spec['dport'], flags=spec['flags'] or 'PA')
                    / Raw(load=spec['payload'])
                )
            else:
                pkt = (
                    Ether()
                    / IP(src=spec['src_ip'], dst=spec['dst_ip'], ttl=rng.randint(32, 128))
                    / UDP(sport=spec['sport'], dport=spec['dport'])
                    / Raw(load=spec['payload'])
                )

            ip_layer = pkt[IP]
            raw_payload = bytes(pkt[Raw]) if pkt.haslayer(Raw) else spec['payload']
            entropy = _shannon_entropy(raw_payload)

            layer_parts = ['Ethernet', 'IPv4']
            layer_parts.append('TCP' if spec['proto'] == 'TCP' else 'UDP')
            layer_parts.append('Raw')
            layer_summary = ' → '.join(layer_parts)

            ttl = ip_layer.ttl
            tcp_flags = str(pkt[TCP].flags) if spec['proto'] == 'TCP' and pkt.haslayer(TCP) else 'N/A'
        else:
            entropy = _shannon_entropy(spec['payload'])
            layer_summary = f"Ethernet → IPv4 → {spec['proto']} → Raw"
            ttl = rng.randint(32, 128)
            tcp_flags = spec['flags'] or 'N/A'

        if defense_enabled:
            # Simulate AES-encrypted payload — high entropy, opaque content
            encrypted_bytes = bytes(rng.getrandbits(8) for _ in range(len(spec['payload'])))
            entropy = _shannon_entropy(encrypted_bytes)
            payload_preview = encrypted_bytes.hex()[:40] + '...'
            protocol_label = 'TLS'
            readable = False
        else:
            payload_text = spec['payload'].decode('latin-1', errors='replace')
            payload_preview = payload_text[:64].replace('\r\n', ' ↵ ')
            protocol_label = spec['proto']
            readable = True

        raw_packets.append({
            'id': f"forensic-{spec['sport']}",
            'time': f"11:0{rng.randint(0,9)}:{rng.randint(10,59)}",
            'source': spec['src_ip'],
            'target': spec['dst_ip'],
            'protocol': protocol_label,
            'status': 'encrypted_capture' if defense_enabled else 'captured',
            'readable': readable,
            'intercepted': True,
            'payload_preview': payload_preview,
            # Forensic extras
            'label': spec['label'],
            'layer_summary': layer_summary,
            'ttl': ttl,
            'tcp_flags': tcp_flags,
            'src_port': spec['sport'],
            'dst_port': spec['dport'],
            'packet_size': len(spec['payload']) + 54,  # approx with headers
            'inter_arrival_ms': rng.randint(5, 200),
            'entropy_score': round(entropy, 3),
            'entropy_label': _entropy_label(entropy),
        })

    return raw_packets


def _entropy_label(entropy: float) -> str:
    if entropy < 3.5:
        return 'Plaintext'
    elif entropy < 6.0:
        return 'Mixed'
    else:
        return 'Encrypted'


def build_forensic_packets(defense_enabled: bool = False) -> list:
    """
    Public API used by packet_sniffing_scenario.
    Returns forensic-enriched packet dicts with scapy analysis when available.
    """
    return _build_scapy_packets(defense_enabled)
