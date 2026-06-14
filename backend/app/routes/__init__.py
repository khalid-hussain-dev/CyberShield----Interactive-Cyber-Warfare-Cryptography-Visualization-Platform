from app.routes.auth import auth_bp
from app.routes.crypto import crypto_bp
from app.routes.health import health_bp
from app.routes.root import root_bp
from app.routes.simulation import simulation_bp
from app.routes.report import report_bp
from app.routes.blockchain import blockchain_bp
from app.routes.scoring import scoring_bp
from app.routes.ids import ids_bp
from app.routes.duel import duel_bp


def register_routes(app):
    app.register_blueprint(root_bp)
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(crypto_bp, url_prefix='/api/crypto')
    app.register_blueprint(simulation_bp, url_prefix='/api')
    app.register_blueprint(report_bp, url_prefix='/api/reports')
    app.register_blueprint(blockchain_bp, url_prefix='/api/blockchain')
    app.register_blueprint(scoring_bp, url_prefix='/api/scores')
    app.register_blueprint(ids_bp, url_prefix='/api/ids')
    app.register_blueprint(duel_bp, url_prefix='/api/duel')
