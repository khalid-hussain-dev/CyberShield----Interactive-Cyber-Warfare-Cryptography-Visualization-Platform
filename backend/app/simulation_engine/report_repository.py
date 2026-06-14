import sqlite3

from app.auth.storage import get_connection


def create_report(user_id, scenario_id, scenario_name, risk_score_before, risk_score_after):
    connection = get_connection()
    try:
        cursor = connection.execute(
            '''
            INSERT INTO reports (user_id, scenario_id, scenario_name, risk_score_before, risk_score_after)
            VALUES (?, ?, ?, ?, ?)
            ''',
            (user_id, scenario_id, scenario_name, int(risk_score_before), int(risk_score_after)),
        )
        connection.commit()
        report_id = cursor.lastrowid
    finally:
        connection.close()

    return find_report_by_id(report_id)


def find_report_by_id(report_id):
    connection = get_connection()
    try:
        row = connection.execute(
            'SELECT * FROM reports WHERE id = ?',
            (report_id,),
        ).fetchone()
    finally:
        connection.close()

    return row_to_report(row)


def get_user_reports(user_id):
    connection = get_connection()
    try:
        rows = connection.execute(
            'SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,),
        ).fetchall()
    finally:
        connection.close()

    return [row_to_report(row) for row in rows]


def row_to_report(row):
    if row is None:
        return None

    return {
        'id': row['id'],
        'user_id': row['user_id'],
        'scenario_id': row['scenario_id'],
        'scenario_name': row['scenario_name'],
        'risk_score_before': row['risk_score_before'],
        'risk_score_after': row['risk_score_after'],
        'created_at': row['created_at'],
    }
