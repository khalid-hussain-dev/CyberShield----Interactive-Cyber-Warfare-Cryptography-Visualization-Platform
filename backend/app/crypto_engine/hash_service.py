import hashlib


def sha256_digest(text):
    if not isinstance(text, str):
        raise ValueError('text must be a string.')

    return {
        'algorithm': 'SHA-256',
        'digest': hashlib.sha256(text.encode('utf-8')).hexdigest(),
    }

