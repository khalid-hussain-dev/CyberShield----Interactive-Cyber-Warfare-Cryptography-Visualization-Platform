def build_event_stream(state):
    events = []

    for index, packet in enumerate(state.get('packets', []), start=1):
        events.append(
            {
                'id': f"packet-{index}",
                'kind': 'packet',
                'channel': 'network',
                'time': packet.get('time', '--:--:--'),
                'message': f"{packet.get('source')} -> {packet.get('target')} [{packet.get('status')}]",
                'packet': packet,
            }
        )

    for index, log in enumerate(state.get('attack_logs', []), start=1):
        events.append(
            {
                'id': f"attack-log-{index}",
                'kind': 'log',
                'channel': 'hacker',
                'time': extract_time(log),
                'message': log,
            }
        )

    for index, log in enumerate(state.get('defense_logs', []), start=1):
        events.append(
            {
                'id': f"defense-log-{index}",
                'kind': 'log',
                'channel': 'defender',
                'time': extract_time(log),
                'message': log,
            }
        )

    for index, alert in enumerate(state.get('alerts', []), start=1):
        events.append(
            {
                'id': f"alert-{index}",
                'kind': 'alert',
                'channel': 'defender',
                'time': alert.get('time', '--:--:--'),
                'message': alert.get('title', 'Security alert'),
                'severity': alert.get('severity', 'Medium'),
            }
        )

    events.append(
        {
            'id': 'simulation-complete',
            'kind': 'status',
            'channel': 'system',
            'time': '--:--:--',
            'message': 'Simulation stream complete',
        }
    )

    return events


def extract_time(log_line):
    if isinstance(log_line, str) and log_line.startswith('[') and ']' in log_line:
        return log_line[1:log_line.index(']')]

    return '--:--:--'
