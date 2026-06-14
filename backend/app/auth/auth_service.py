from app.auth.password_service import hash_password, password_matches
from app.auth.token_service import serialize_user, token_response
from app.auth.user_repository import create_user, find_user_by_email, find_user_by_id
from app.utils.errors import ApiError


def register_user(username, email, password):
    validate_username(username)
    password_hash = hash_password(password)
    user = create_user(username.strip(), email, password_hash)
    return token_response(user)


def authenticate_user(email, password):
    user = find_user_by_email(email)

    if user is None or not password_matches(user['password_hash'], password):
        raise ApiError('Invalid email or password.', status_code=401)

    return token_response(user)


def get_user_profile(user_id):
    user = find_user_by_id(user_id)

    if user is None:
        raise ApiError('Authenticated user no longer exists.', status_code=401)

    return serialize_user(user)


def validate_username(username):
    if not isinstance(username, str) or len(username.strip()) < 3:
        raise ValueError('Username must be at least 3 characters long.')

