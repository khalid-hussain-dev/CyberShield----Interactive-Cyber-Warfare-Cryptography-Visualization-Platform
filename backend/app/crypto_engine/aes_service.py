import os

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.crypto_engine.encoding import decode_base64, encode_base64


AES_KEY_BYTES = 32
AES_NONCE_BYTES = 12


def generate_aes_key():
    return encode_base64(os.urandom(AES_KEY_BYTES))


def encrypt_text_with_aes(plaintext, key=None):
    if not isinstance(plaintext, str):
        raise ValueError('plaintext must be a string.')

    key_bytes = resolve_aes_key(key)
    nonce = os.urandom(AES_NONCE_BYTES)
    ciphertext = AESGCM(key_bytes).encrypt(nonce, plaintext.encode('utf-8'), None)

    return {
        'algorithm': 'AES-256-GCM',
        'key': encode_base64(key_bytes),
        'nonce': encode_base64(nonce),
        'ciphertext': encode_base64(ciphertext),
    }


def decrypt_text_with_aes(ciphertext, key, nonce):
    key_bytes = resolve_aes_key(key)
    nonce_bytes = decode_base64(nonce, 'nonce')
    ciphertext_bytes = decode_base64(ciphertext, 'ciphertext')

    if len(nonce_bytes) != AES_NONCE_BYTES:
        raise ValueError('AES-GCM nonce must decode to 12 bytes.')

    try:
        plaintext = AESGCM(key_bytes).decrypt(nonce_bytes, ciphertext_bytes, None)
    except InvalidTag as error:
        raise ValueError('AES authentication failed. Ciphertext, key, or nonce is invalid.') from error

    return plaintext.decode('utf-8')


def resolve_aes_key(key):
    if key is None:
        return os.urandom(AES_KEY_BYTES)

    key_bytes = decode_base64(key, 'key')
    if len(key_bytes) != AES_KEY_BYTES:
        raise ValueError('AES-256 key must decode to 32 bytes.')

    return key_bytes

