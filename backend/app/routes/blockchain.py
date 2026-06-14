from flask import Blueprint, g, jsonify, request

from app.auth import require_auth
from app.simulation_engine.blockchain_engine import get_chain, verify_chain, tamper_block, untamper_block
from app.utils.responses import success_response, error_response

blockchain_bp = Blueprint('blockchain', __name__)


@blockchain_bp.route('/chain', methods=['GET'])
@require_auth
def get_user_chain():
    chain = get_chain(g.current_user['id'])
    return success_response('Chain loaded', data={'chain': chain, 'length': len(chain)})


@blockchain_bp.route('/verify', methods=['GET'])
@require_auth
def verify_user_chain():
    result = verify_chain(g.current_user['id'])
    return success_response('Chain verification complete', data=result)


@blockchain_bp.route('/tamper', methods=['POST'])
@require_auth
def tamper_user_chain():
    success = tamper_block(g.current_user['id'])
    if not success:
        return error_response('Failed to tamper. No blocks exist to tamper with.', status_code=400)
    return success_response('Latest block payload modified. Verification will now fail.', data={'tampered': True})


@blockchain_bp.route('/restore', methods=['POST'])
@require_auth
def restore_user_chain():
    success = untamper_block(g.current_user['id'])
    if not success:
        return error_response('Failed to restore. No blocks exist or block is not tampered.', status_code=400)
    return success_response('Latest block payload restored. Verification should now pass.', data={'restored': True})

