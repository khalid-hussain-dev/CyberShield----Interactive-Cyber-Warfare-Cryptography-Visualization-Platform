from flask import Blueprint

from app.utils.responses import success_response


health_bp = Blueprint('health', __name__)


@health_bp.get('/health')
def health_check():
    return success_response(
        'CyberShield backend is online',
        data={
            'service': 'cybershield-api',
            'status': 'ok',
            'version': '0.1.0',
        },
    )

