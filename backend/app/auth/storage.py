import sqlite3
from pathlib import Path

from flask import current_app


SCHEMA = '''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    scenario_id TEXT NOT NULL,
    scenario_name TEXT NOT NULL,
    risk_score_before INTEGER NOT NULL,
    risk_score_after INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS blockchain_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    block_index INTEGER NOT NULL,
    prev_hash   TEXT NOT NULL,
    payload     TEXT NOT NULL,
    block_hash  TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS operator_scores (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL UNIQUE,
    xp                INTEGER NOT NULL DEFAULT 0,
    rank              TEXT NOT NULL DEFAULT 'Trainee',
    defenses_deployed INTEGER NOT NULL DEFAULT 0,
    attacks_blocked   INTEGER NOT NULL DEFAULT 0,
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
'''



import os

class PostgresCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()

class PostgresConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def execute(self, sql, params=None):
        from psycopg2.extras import RealDictCursor
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        formatted_sql = sql.replace('?', '%s')
        cursor.execute(formatted_sql, params or ())
        return PostgresCursorWrapper(cursor)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

def initialize_auth_storage(app):
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        import psycopg2
        connection = psycopg2.connect(db_url)
        try:
            cursor = connection.cursor()
            formatted_schema = SCHEMA.replace('AUTOINCREMENT', '')
            formatted_schema = formatted_schema.replace('INTEGER PRIMARY KEY', 'SERIAL PRIMARY KEY')
            cursor.execute(formatted_schema)
            connection.commit()
        finally:
            connection.close()
    else:
        database_path = Path(app.config['DATABASE_PATH'])
        database_path.parent.mkdir(parents=True, exist_ok=True)

        connection = sqlite3.connect(database_path)
        try:
            connection.executescript(SCHEMA)
            connection.commit()
        finally:
            connection.close()


def get_connection():
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        import psycopg2
        connection = psycopg2.connect(db_url)
        return PostgresConnectionWrapper(connection)
    else:
        database_path = Path(current_app.config['DATABASE_PATH'])
        database_path.parent.mkdir(parents=True, exist_ok=True)

        connection = sqlite3.connect(database_path)
        connection.row_factory = sqlite3.Row
        return connection

