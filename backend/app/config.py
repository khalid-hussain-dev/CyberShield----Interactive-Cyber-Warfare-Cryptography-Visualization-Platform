import os
from pathlib import Path


class Config:
    SECRET_KEY = os.getenv('CYBERSHIELD_SECRET_KEY', 'dev-secret-change-before-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    JSON_SORT_KEYS = False
    DATABASE_PATH = os.getenv(
        'CYBERSHIELD_DATABASE_PATH',
        str(Path(__file__).resolve().parents[1] / 'instance' / 'cybershield.sqlite'),
    )
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRY_SECONDS = 3600
