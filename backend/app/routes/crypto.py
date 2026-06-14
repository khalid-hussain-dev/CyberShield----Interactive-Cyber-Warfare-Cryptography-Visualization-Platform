from flask import Blueprint, request

from app.crypto_engine import (
    decrypt_text_with_aes,
    decrypt_text_with_rsa,
    encrypt_text_with_aes,
    encrypt_text_with_rsa,
    generate_rsa_key_pair,
    sha256_digest,
    sign_text,
    verify_signature,
)
from app.utils.responses import success_response


crypto_bp = Blueprint('crypto', __name__)


def json_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ValueError('Request body must be a JSON object.')

    return body


def required(body, field_name):
    value = body.get(field_name)
    if value is None or value == '':
        raise ValueError(f'Missing required field: {field_name}')

    return value


@crypto_bp.post('/aes/encrypt')
def aes_encrypt():
    body = json_body()
    result = encrypt_text_with_aes(
        plaintext=required(body, 'plaintext'),
        key=body.get('key'),
    )
    return success_response('AES encryption successful', data=result)


@crypto_bp.post('/aes/decrypt')
def aes_decrypt():
    body = json_body()
    plaintext = decrypt_text_with_aes(
        ciphertext=required(body, 'ciphertext'),
        key=required(body, 'key'),
        nonce=required(body, 'nonce'),
    )
    return success_response('AES decryption successful', data={'plaintext': plaintext})


@crypto_bp.post('/rsa/keypair')
def rsa_keypair():
    return success_response('RSA key pair generated', data=generate_rsa_key_pair())


@crypto_bp.post('/rsa/encrypt')
def rsa_encrypt():
    body = json_body()
    result = encrypt_text_with_rsa(
        plaintext=required(body, 'plaintext'),
        public_key=required(body, 'public_key'),
    )
    return success_response('RSA encryption successful', data=result)


@crypto_bp.post('/rsa/decrypt')
def rsa_decrypt():
    body = json_body()
    plaintext = decrypt_text_with_rsa(
        ciphertext=required(body, 'ciphertext'),
        private_key=required(body, 'private_key'),
    )
    return success_response('RSA decryption successful', data={'plaintext': plaintext})


@crypto_bp.post('/hash/sha256')
def sha256_hash():
    body = json_body()
    return success_response(
        'SHA-256 digest generated',
        data=sha256_digest(required(body, 'text')),
    )


@crypto_bp.post('/signature/sign')
def signature_sign():
    body = json_body()
    result = sign_text(
        message=required(body, 'message'),
        private_key=required(body, 'private_key'),
    )
    return success_response('Digital signature generated', data=result)


@crypto_bp.post('/signature/verify')
def signature_verify():
    body = json_body()
    result = verify_signature(
        message=required(body, 'message'),
        signature=required(body, 'signature'),
        public_key=required(body, 'public_key'),
    )
    return success_response('Digital signature verified', data=result)

