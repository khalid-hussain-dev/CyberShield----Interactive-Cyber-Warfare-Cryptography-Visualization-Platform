from app.auth.storage import get_connection

# XP awarded per event type
XP_TABLE = {
    'launch': 10,
    'defend': 25,
    'report_exported': 15,
    'scenario_completed': 20,
    'duel_winner': 50,
}

# Rank thresholds (minimum XP to achieve that rank)
RANKS = [
    (0,   'Trainee'),
    (50,  'Analyst'),
    (150, 'Defender'),
    (350, 'Expert'),
    (700, 'Elite'),
]


def _compute_rank(xp: int) -> str:
    rank = 'Trainee'
    for threshold, title in RANKS:
        if xp >= threshold:
            rank = title
    return rank


def _next_rank_info(xp: int) -> dict:
    """Returns XP needed for next rank and that rank's name."""
    for threshold, title in RANKS:
        if xp < threshold:
            return {'next_rank': title, 'xp_needed': threshold - xp, 'next_threshold': threshold}
    return {'next_rank': 'Elite', 'xp_needed': 0, 'next_threshold': xp}


def _ensure_score_row(user_id: int, connection):
    connection.execute(
        'INSERT OR IGNORE INTO operator_scores (user_id) VALUES (?)',
        (user_id,),
    )


def award_xp(user_id: int, event_type: str) -> dict:
    """
    Award XP for a scoring event and update rank.
    Returns the updated score record.
    """
    xp_gain = XP_TABLE.get(event_type, 0)
    if xp_gain == 0:
        return get_score(user_id)

    connection = get_connection()
    try:
        _ensure_score_row(user_id, connection)

        extra_cols = ''
        if event_type == 'defend':
            extra_cols = ', defenses_deployed = defenses_deployed + 1, attacks_blocked = attacks_blocked + 1'
        elif event_type == 'launch':
            extra_cols = ''

        # Fetch current XP first to compute new rank
        row = connection.execute(
            'SELECT xp FROM operator_scores WHERE user_id = ?',
            (user_id,),
        ).fetchone()
        new_xp = (row['xp'] if row else 0) + xp_gain
        new_rank = _compute_rank(new_xp)

        connection.execute(
            f'''
            UPDATE operator_scores
            SET xp = ?, rank = ?, updated_at = CURRENT_TIMESTAMP {extra_cols}
            WHERE user_id = ?
            ''',
            (new_xp, new_rank, user_id),
        )
        connection.commit()
    finally:
        connection.close()

    return get_score(user_id)


def get_score(user_id: int) -> dict:
    connection = get_connection()
    try:
        _ensure_score_row(user_id, connection)
        connection.commit()
        row = connection.execute(
            'SELECT * FROM operator_scores WHERE user_id = ?',
            (user_id,),
        ).fetchone()
    finally:
        connection.close()

    return _row_to_score(row)


def get_leaderboard() -> list:
    connection = get_connection()
    try:
        rows = connection.execute(
            '''
            SELECT os.*, u.username
            FROM operator_scores os
            JOIN users u ON u.id = os.user_id
            ORDER BY os.xp DESC
            LIMIT 10
            ''',
        ).fetchall()
    finally:
        connection.close()

    return [_row_to_leaderboard_entry(row, rank + 1) for rank, row in enumerate(rows)]


def _row_to_score(row) -> dict:
    if row is None:
        return {
            'xp': 0,
            'rank': 'Trainee',
            'defenses_deployed': 0,
            'attacks_blocked': 0,
            'next_rank_info': _next_rank_info(0),
        }

    xp = row['xp']
    return {
        'xp': xp,
        'rank': row['rank'],
        'defenses_deployed': row['defenses_deployed'],
        'attacks_blocked': row['attacks_blocked'],
        'next_rank_info': _next_rank_info(xp),
    }


def _row_to_leaderboard_entry(row, position: int) -> dict:
    return {
        'position': position,
        'username': row['username'],
        'xp': row['xp'],
        'rank': row['rank'],
        'defenses_deployed': row['defenses_deployed'],
        'attacks_blocked': row['attacks_blocked'],
    }
