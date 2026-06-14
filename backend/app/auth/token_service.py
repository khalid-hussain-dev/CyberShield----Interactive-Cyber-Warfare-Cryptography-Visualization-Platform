from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app

from app.utils.errors import ApiError


def create_access_token(user):
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(seconds=current_app.config['JWT_EXPIRY_SECONDS'])
    payload = {
        'sub': str(user['id']),
        'username': user['username'],
        'role': user['role'],
        'iat': issued_at,
        'exp': expires_at,
    }

    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm=current_app.config['JWT_ALGORITHM'])


def decode_access_token(token):
    try:
        return jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=[current_app.config['JWT_ALGORITHM']],
        )
    except jwt.ExpiredSignatureError as error:
        raise ApiError('Authentication token has expired.', status_code=401) from error
    except jwt.InvalidTokenError as error:
        raise ApiError('Authentication token is invalid.', status_code=401) from error


def token_response(user):
    return {
        'access_token': create_access_token(user),
        'token_type': 'Bearer',
        'expires_in': current_app.config['JWT_EXPIRY_SECONDS'],
        'user': serialize_user(user),
    }


def serialize_user(user):
    return {
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'role': user['role'],
    }

