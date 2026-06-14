from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

from app.crypto_engine.encoding import decode_base64, encode_base64
from app.crypto_engine.rsa_service import load_private_key, load_public_key


def sign_text(message, private_key):
    if not isinstance(message, str):
        raise ValueError('message must be a string.')

    loaded_private_key = load_private_key(private_key)
    signature = loaded_private_key.sign(
        message.encode('utf-8'),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256(),
    )

    return {
        'algorithm': 'RSA-PSS-SHA256',
        'signature': encode_base64(signature),
    }


def verify_signature(message, signature, public_key):
    if not isinstance(message, str):
        raise ValueError('message must be a string.')

    loaded_public_key = load_public_key(public_key)
    signature_bytes = decode_base64(signature, 'signature')

    try:
        loaded_public_key.verify(
            signature_bytes,
            message.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )
    except InvalidSignature:
        return {
            'valid': False,
            'algorithm': 'RSA-PSS-SHA256',
        }

    return {
        'valid': True,
        'algorithm': 'RSA-PSS-SHA256',
    }

