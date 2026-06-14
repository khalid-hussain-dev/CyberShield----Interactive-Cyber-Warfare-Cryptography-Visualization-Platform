from functools import wraps

from flask import g, request

from app.auth.auth_service import get_user_profile
from app.auth.token_service import decode_access_token
from app.utils.errors import ApiError


def require_auth(route_handler):
    @wraps(route_handler)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            raise ApiError('Bearer authentication token is required.', status_code=401)

        token = auth_header.removeprefix('Bearer ').strip()
        payload = decode_access_token(token)
        g.current_user = get_user_profile(payload['sub'])

        return route_handler(*args, **kwargs)

    return wrapper

