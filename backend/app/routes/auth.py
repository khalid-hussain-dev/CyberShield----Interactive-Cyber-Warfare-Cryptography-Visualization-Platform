from flask import Blueprint, g, request

from app.auth import authenticate_user, register_user, require_auth
from app.utils.responses import success_response


auth_bp = Blueprint('auth', __name__)


def json_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ValueError('Request body must be a JSON object.')

    return body


def required(body, field_name):
    value = body.get(field_name)
    if value is None or value == '':
        raise ValueError(f'Missing required field: {field_name}')

    return value


@auth_bp.post('/register')
def register():
    body = json_body()
    result = register_user(
        username=required(body, 'username'),
        email=required(body, 'email'),
        password=required(body, 'password'),
    )
    return success_response('Registration successful', data=result, status_code=201)


@auth_bp.post('/login')
def login():
    body = json_body()
    result = authenticate_user(
        email=required(body, 'email'),
        password=required(body, 'password'),
    )
    return success_response('Login successful', data=result)


@auth_bp.get('/me')
@require_auth
def me():
    return success_response('Authenticated user loaded', data={'user': g.current_user})

