import hashlib
import json

from app.auth.storage import get_connection

GENESIS_HASH = '0' * 64


def _compute_hash(prev_hash: str, payload: str) -> str:
    """SHA-256(prev_hash + payload)"""
    raw = (prev_hash + payload).encode('utf-8')
    return hashlib.sha256(raw).hexdigest()


def _get_last_block(user_id: int, connection):
    row = connection.execute(
        'SELECT block_index, block_hash FROM blockchain_log WHERE user_id = ? ORDER BY block_index DESC LIMIT 1',
        (user_id,),
    ).fetchone()
    if row is None:
        return -1, GENESIS_HASH
    return row['block_index'], row['block_hash']


def mine_block(user_id: int, payload_dict: dict) -> dict:
    """Append a new block to the user's chain. Returns the newly created block."""
    payload_str = json.dumps(payload_dict, sort_keys=True)
    connection = get_connection()
    try:
        prev_index, prev_hash = _get_last_block(user_id, connection)
        block_index = prev_index + 1
        block_hash = _compute_hash(prev_hash, payload_str)

        connection.execute(
            '''
            INSERT INTO blockchain_log (user_id, block_index, prev_hash, payload, block_hash)
            VALUES (?, ?, ?, ?, ?)
            ''',
            (user_id, block_index, prev_hash, payload_str, block_hash),
        )
        connection.commit()
        block_id = connection.execute(
            'SELECT id, created_at FROM blockchain_log WHERE user_id = ? AND block_index = ?',
            (user_id, block_index),
        ).fetchone()
        return {
            'id': block_id['id'],
            'block_index': block_index,
            'prev_hash': prev_hash,
            'payload': payload_dict,
            'block_hash': block_hash,
            'created_at': block_id['created_at'],
        }
    finally:
        connection.close()


def get_chain(user_id: int) -> list:
    """Return the full ordered chain for a user."""
    connection = get_connection()
    try:
        rows = connection.execute(
            'SELECT * FROM blockchain_log WHERE user_id = ? ORDER BY block_index ASC',
            (user_id,),
        ).fetchall()
    finally:
        connection.close()

    return [_row_to_block(row) for row in rows]


def verify_chain(user_id: int) -> dict:
    """
    Recompute every block hash from scratch and check linkage.
    Returns { valid: bool, broken_at: int|None, total_blocks: int }
    """
    chain = get_chain(user_id)

    if not chain:
        return {'valid': True, 'broken_at': None, 'total_blocks': 0}

    expected_prev = GENESIS_HASH

    for block in chain:
        payload_str = json.dumps(block['payload'], sort_keys=True)
        expected_hash = _compute_hash(expected_prev, payload_str)

        if block['prev_hash'] != expected_prev:
            return {'valid': False, 'broken_at': block['block_index'], 'total_blocks': len(chain)}

        if block['block_hash'] != expected_hash:
            return {'valid': False, 'broken_at': block['block_index'], 'total_blocks': len(chain)}

        expected_prev = block['block_hash']

    return {'valid': True, 'broken_at': None, 'total_blocks': len(chain)}


def _row_to_block(row) -> dict:
    payload = row['payload']
    try:
        payload = json.loads(payload)
    except (json.JSONDecodeError, TypeError):
        pass

    return {
        'id': row['id'],
        'block_index': row['block_index'],
        'prev_hash': row['prev_hash'],
        'payload': payload,
        'block_hash': row['block_hash'],
        'created_at': row['created_at'],
    }


def tamper_block(user_id: int) -> bool:
    """Tamper with the payload of the latest block in the database for the user."""
    connection = get_connection()
    try:
        row = connection.execute(
            'SELECT id, payload FROM blockchain_log WHERE user_id = ? ORDER BY block_index DESC LIMIT 1',
            (user_id,),
        ).fetchone()
        if not row:
            return False

        try:
            payload_dict = json.loads(row['payload'])
            payload_dict['risk_score_after'] = 99  # Flagrant alteration
            tampered_payload_str = json.dumps(payload_dict, sort_keys=True)
        except Exception:
            tampered_payload_str = row['payload'] + '_tampered'

        connection.execute(
            'UPDATE blockchain_log SET payload = ? WHERE id = ?',
            (tampered_payload_str, row['id']),
        )
        connection.commit()
        return True
    finally:
        connection.close()


def untamper_block(user_id: int) -> bool:
    """Restore the payload of all tampered blocks in the database for the user using the reports table."""
    connection = get_connection()
    try:
        rows = connection.execute(
            'SELECT id, payload FROM blockchain_log WHERE user_id = ? ORDER BY block_index ASC',
            (user_id,),
        ).fetchall()
        if not rows:
            return False

        restored_any = False
        for row in rows:
            try:
                payload_str = row['payload']
                if payload_str.endswith('_tampered'):
                    restored_payload_str = payload_str[:-9]  # Remove '_tampered'
                    connection.execute(
                        'UPDATE blockchain_log SET payload = ? WHERE id = ?',
                        (restored_payload_str, row['id']),
                    )
                    restored_any = True
                    continue

                payload_dict = json.loads(payload_str)
                report_id = payload_dict.get('report_id')
                if not report_id:
                    continue

                # Query original report to get original risk_score_after
                report_row = connection.execute(
                    'SELECT risk_score_after FROM reports WHERE id = ?',
                    (report_id,),
                ).fetchone()
                if not report_row:
                    continue

                original_score = int(report_row['risk_score_after'])
                if int(payload_dict.get('risk_score_after', 0)) != original_score:
                    payload_dict['risk_score_after'] = original_score
                    restored_payload_str = json.dumps(payload_dict, sort_keys=True)
                    connection.execute(
                        'UPDATE blockchain_log SET payload = ? WHERE id = ?',
                        (restored_payload_str, row['id']),
                    )
                    restored_any = True
            except Exception:
                continue

        if restored_any:
            connection.commit()
            return True
        return False
    finally:
        connection.close()

