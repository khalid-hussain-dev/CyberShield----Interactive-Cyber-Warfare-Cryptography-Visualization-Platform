import sqlite3

from app.auth.storage import get_connection
from app.utils.errors import ApiError


def create_user(username, email, password_hash, role='student'):
    connection = get_connection()
    try:
        cursor = connection.execute(
            '''
            INSERT INTO users (username, email, password_hash, role)
            VALUES (?, ?, ?, ?)
            ''',
            (username, normalize_email(email), password_hash, role),
        )
        connection.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError as error:
        raise ApiError('A user with this username or email already exists.', status_code=409) from error
    finally:
        connection.close()

    return find_user_by_id(user_id)


def find_user_by_email(email):
    connection = get_connection()
    try:
        row = connection.execute(
            'SELECT * FROM users WHERE email = ?',
            (normalize_email(email),),
        ).fetchone()
    finally:
        connection.close()

    return row_to_user(row)


def find_user_by_id(user_id):
    connection = get_connection()
    try:
        row = connection.execute(
            'SELECT * FROM users WHERE id = ?',
            (user_id,),
        ).fetchone()
    finally:
        connection.close()

    return row_to_user(row)


def normalize_email(email):
    if not isinstance(email, str) or '@' not in email:
        raise ValueError('A valid email address is required.')

    return email.strip().lower()


def row_to_user(row):
    if row is None:
        return None

    return {
        'id': row['id'],
        'username': row['username'],
        'email': row['email'],
        'password_hash': row['password_hash'],
        'role': row['role'],
        'created_at': row['created_at'],
    }
