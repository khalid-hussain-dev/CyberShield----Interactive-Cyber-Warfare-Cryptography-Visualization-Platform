from flask import Blueprint

from app.utils.responses import success_response


root_bp = Blueprint('root', __name__)


@root_bp.get('/')
def api_root():
    return success_response(
        'CyberShield API is running',
        data={
            'auth': '/api/auth',
            'health': '/api/health',
            'crypto': '/api/crypto',
            'scenarios': '/api/scenarios',
            'simulations': '/api/simulations/run',
            'realtime': 'Socket.IO event simulation:start',
        },
    )
