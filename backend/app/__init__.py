from flask import Flask, current_app

from app.auth.storage import initialize_auth_storage
from app.config import Config
from app.extensions import socketio
from app.realtime.events import register_socket_events
from app.realtime.duel_events import register_duel_events
from app.routes import register_routes
from app.utils.errors import ApiError
from app.utils.responses import error_response


def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config.from_object(Config)

    if config_overrides:
        app.config.update(config_overrides)

    register_routes(app)
    register_error_handlers(app)
    initialize_auth_storage(app)
    socketio.init_app(app)
    register_socket_events(socketio)
    register_duel_events(socketio)

    return app


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error):
        return error_response(error.message, status_code=error.status_code)

    @app.errorhandler(ValueError)
    def handle_bad_request(error):
        return error_response(str(error), status_code=400)

    @app.errorhandler(404)
    def handle_not_found(_error):
        return error_response('Endpoint not found', status_code=404)

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        if current_app.config.get('TESTING'):
            raise error

        current_app.logger.exception('Unhandled backend error')
        return error_response('Unexpected server error', status_code=500)
