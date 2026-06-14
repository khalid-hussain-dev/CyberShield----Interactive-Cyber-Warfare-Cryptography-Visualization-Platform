from flask import jsonify


def api_response(success, message, data=None, errors=None, status_code=200):
    payload = {
        'success': success,
        'message': message,
        'data': data if data is not None else {},
    }

    if errors:
        payload['errors'] = errors

    return jsonify(payload), status_code


def success_response(message, data=None, status_code=200):
    return api_response(True, message, data=data, status_code=status_code)


def error_response(message, errors=None, status_code=400):
    return api_response(False, message, errors=errors, status_code=status_code)

