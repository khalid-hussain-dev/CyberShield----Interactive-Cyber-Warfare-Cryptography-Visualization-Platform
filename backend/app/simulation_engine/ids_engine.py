"""
AI-Based Intrusion Detection System using Isolation Forest.

The model is trained on first import using synthetic feature vectors
representing benign and attack traffic — no training data files needed,
no GPU required. Training takes < 50 ms.
"""

import math
import random

# ---------------------------------------------------------------------------
# Graceful scikit-learn import — IDS degrades to rule-based if not installed
# ---------------------------------------------------------------------------
try:
    from sklearn.ensemble import IsolationForest
    import numpy as np
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False

# Feature indices
# [packet_size, inter_arrival_ms, protocol_id, dst_port, payload_entropy]
_FEATURE_COUNT = 5
_MODEL = None


def _shannon_entropy(text: str) -> float:
    """Compute Shannon entropy of a string (bits per character)."""
    if not text:
        return 0.0
    freq = {}
    for ch in text:
        freq[ch] = freq.get(ch, 0) + 1
    n = len(text)
    return -sum((c / n) * math.log2(c / n) for c in freq.values())


def _build_training_data():
    """Generate synthetic benign and attack feature vectors."""
    rng = random.Random(42)
    benign = []
    attacks = []

    # Benign: normal-sized packets, regular timing, standard ports, low entropy payloads
    for _ in range(300):
        benign.append([
            rng.randint(64, 1400),    # packet_size
            rng.randint(20, 200),      # inter_arrival_ms
            rng.choice([6, 17, 1]),    # TCP=6, UDP=17, ICMP=1
            rng.choice([80, 443, 53, 22, 25]),  # dst_port
            rng.uniform(2.0, 4.5),     # payload_entropy (low = readable text)
        ])

    # Attack: unusual sizes, rapid timing, odd ports, high entropy (encrypted/obfuscated)
    for _ in range(100):
        attacks.append([
            rng.choice([rng.randint(1400, 65535), rng.randint(1, 40)]),  # oversized or tiny
            rng.randint(0, 5),          # very fast inter-arrival (flood)
            rng.choice([6, 17, 132]),   # SCTP=132 unusual
            rng.choice([4444, 1337, 31337, 8080, 9001]),  # suspicious ports
            rng.uniform(6.5, 8.0),      # high entropy (encrypted C2 / shellcode)
        ])

    return benign, attacks


def _get_model():
    global _MODEL
    if _MODEL is not None:
        return _MODEL

    if not _SKLEARN_AVAILABLE:
        return None

    benign, attacks = _build_training_data()
    X_train = np.array(benign)  # Train only on benign for unsupervised anomaly detection

    model = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42,
    )
    model.fit(X_train)
    _MODEL = model
    return _MODEL


def _extract_features(packet: dict) -> list:
    """Extract numeric feature vector from a packet dict."""
    payload = str(packet.get('payload_preview', packet.get('payload', '')))
    protocol_map = {'TCP': 6, 'UDP': 17, 'ICMP': 1, 'HTTP': 6, 'FTP': 6, 'TLS': 6, 'HTTPS': 6}
    protocol_id = protocol_map.get(str(packet.get('protocol', 'TCP')).upper(), 6)

    return [
        int(packet.get('packet_size', len(payload) or 512)),
        int(packet.get('inter_arrival_ms', 50)),
        protocol_id,
        int(packet.get('dst_port', 80)),
        _shannon_entropy(payload),
    ]


def _rule_based_classify(features: list) -> dict:
    """Fallback rule-based classifier when sklearn is unavailable."""
    packet_size, inter_arrival_ms, protocol_id, dst_port, entropy = features
    suspicious_ports = {4444, 1337, 31337, 8080, 9001, 6667}

    score = 0
    if packet_size > 10000 or packet_size < 20:
        score += 2
    if inter_arrival_ms < 5:
        score += 2
    if dst_port in suspicious_ports:
        score += 3
    if entropy > 6.5:
        score += 2

    if score >= 5:
        return {'label': 'Attack', 'confidence': min(95, 60 + score * 5), 'anomaly_score': -0.8}
    elif score >= 2:
        return {'label': 'Suspicious', 'confidence': min(80, 40 + score * 10), 'anomaly_score': -0.3}
    else:
        return {'label': 'Normal', 'confidence': 92, 'anomaly_score': 0.4}


def classify_traffic(packets: list) -> list:
    """
    Classify a list of packet dicts.

    Each packet dict may contain:
      - payload_preview / payload (str)
      - protocol (str)
      - packet_size (int, optional)
      - inter_arrival_ms (int, optional)
      - dst_port (int, optional)

    Returns a list of classification dicts with keys:
      - label: 'Normal' | 'Suspicious' | 'Attack'
      - confidence: int (0–100)
      - anomaly_score: float
      - features: dict
    """
    model = _get_model()
    results = []

    for packet in packets:
        features = _extract_features(packet)

        if model is not None and _SKLEARN_AVAILABLE:
            X = np.array([features])
            raw_score = float(model.decision_function(X)[0])
            # raw_score: positive = normal, negative = anomaly
            pred = model.predict(X)[0]  # 1 = normal, -1 = anomaly

            if pred == 1:
                label = 'Normal'
                confidence = min(99, int(70 + raw_score * 30))
            elif raw_score < -0.3:
                label = 'Attack'
                confidence = min(99, int(60 + abs(raw_score) * 40))
            else:
                label = 'Suspicious'
                confidence = min(99, int(50 + abs(raw_score) * 30))

            classification = {
                'label': label,
                'confidence': max(10, confidence),
                'anomaly_score': round(raw_score, 4),
            }
        else:
            classification = _rule_based_classify(features)

        classification['features'] = {
            'packet_size': features[0],
            'inter_arrival_ms': features[1],
            'protocol_id': features[2],
            'dst_port': features[3],
            'payload_entropy': round(features[4], 3),
        }

        results.append(classification)

    return results
