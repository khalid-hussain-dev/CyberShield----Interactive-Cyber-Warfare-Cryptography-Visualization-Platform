from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

from app.crypto_engine.encoding import decode_base64, encode_base64


def generate_rsa_key_pair(key_size=2048):
    if key_size < 2048:
        raise ValueError('RSA key size must be at least 2048 bits.')

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=key_size)
    public_key = private_key.public_key()

    return {
        'algorithm': f'RSA-{key_size}',
        'private_key': private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode('utf-8'),
        'public_key': public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode('utf-8'),
    }


def encrypt_text_with_rsa(plaintext, public_key):
    if not isinstance(plaintext, str):
        raise ValueError('plaintext must be a string.')

    loaded_public_key = load_public_key(public_key)
    ciphertext = loaded_public_key.encrypt(
        plaintext.encode('utf-8'),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    return {
        'algorithm': 'RSA-OAEP-SHA256',
        'ciphertext': encode_base64(ciphertext),
    }


def decrypt_text_with_rsa(ciphertext, private_key):
    loaded_private_key = load_private_key(private_key)
    ciphertext_bytes = decode_base64(ciphertext, 'ciphertext')

    plaintext = loaded_private_key.decrypt(
        ciphertext_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    return plaintext.decode('utf-8')


def load_private_key(private_key):
    if not isinstance(private_key, str):
        raise ValueError('private_key must be a PEM string.')

    return serialization.load_pem_private_key(private_key.encode('utf-8'), password=None)


def load_public_key(public_key):
    if not isinstance(public_key, str):
        raise ValueError('public_key must be a PEM string.')

    return serialization.load_pem_public_key(public_key.encode('utf-8'))

