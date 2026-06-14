import hashlib
import unittest

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


class CryptoEngineTests(unittest.TestCase):
    def test_aes_encrypt_decrypt_round_trip(self):
        message = 'Transfer 2450 PKR to account ACCT-7721'

        encrypted = encrypt_text_with_aes(message)
        decrypted = decrypt_text_with_aes(
            ciphertext=encrypted['ciphertext'],
            key=encrypted['key'],
            nonce=encrypted['nonce'],
        )

        self.assertEqual(encrypted['algorithm'], 'AES-256-GCM')
        self.assertNotEqual(encrypted['ciphertext'], message)
        self.assertEqual(decrypted, message)

    def test_rsa_encrypt_decrypt_round_trip(self):
        message = 'Session key exchange payload'
        key_pair = generate_rsa_key_pair()

        encrypted = encrypt_text_with_rsa(message, key_pair['public_key'])
        decrypted = decrypt_text_with_rsa(encrypted['ciphertext'], key_pair['private_key'])

        self.assertEqual(encrypted['algorithm'], 'RSA-OAEP-SHA256')
        self.assertEqual(decrypted, message)

    def test_sha256_digest_matches_hashlib(self):
        text = 'CyberShield'
        digest = sha256_digest(text)

        self.assertEqual(digest['algorithm'], 'SHA-256')
        self.assertEqual(digest['digest'], hashlib.sha256(text.encode('utf-8')).hexdigest())

    def test_signature_verification_detects_tampering(self):
        message = 'Approve transaction ACCT-7721'
        key_pair = generate_rsa_key_pair()
        signed = sign_text(message, key_pair['private_key'])

        valid_result = verify_signature(message, signed['signature'], key_pair['public_key'])
        tampered_result = verify_signature(
            'Approve transaction ACCT-0000',
            signed['signature'],
            key_pair['public_key'],
        )

        self.assertTrue(valid_result['valid'])
        self.assertFalse(tampered_result['valid'])


if __name__ == '__main__':
    unittest.main()

