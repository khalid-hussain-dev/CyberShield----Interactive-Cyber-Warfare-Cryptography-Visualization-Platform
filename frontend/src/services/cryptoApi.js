import { apiRequest } from './apiClient'

export function aesEncrypt(plaintext, key = null) {
  return apiRequest('/api/crypto/aes/encrypt', {
    method: 'POST',
    body: JSON.stringify({ plaintext, key }),
  })
}

export function aesDecrypt(ciphertext, key, nonce) {
  return apiRequest('/api/crypto/aes/decrypt', {
    method: 'POST',
    body: JSON.stringify({ ciphertext, key, nonce }),
  })
}

export function rsaKeypair() {
  return apiRequest('/api/crypto/rsa/keypair', {
    method: 'POST',
  })
}

export function rsaEncrypt(plaintext, publicKey) {
  return apiRequest('/api/crypto/rsa/encrypt', {
    method: 'POST',
    body: JSON.stringify({ plaintext, public_key: publicKey }),
  })
}

export function rsaDecrypt(ciphertext, privateKey) {
  return apiRequest('/api/crypto/rsa/decrypt', {
    method: 'POST',
    body: JSON.stringify({ ciphertext, private_key: privateKey }),
  })
}

export function sha256Hash(text) {
  return apiRequest('/api/crypto/hash/sha256', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function signatureSign(message, privateKey) {
  return apiRequest('/api/crypto/signature/sign', {
    method: 'POST',
    body: JSON.stringify({ message, private_key: privateKey }),
  })
}

export function signatureVerify(message, signature, publicKey) {
  return apiRequest('/api/crypto/signature/verify', {
    method: 'POST',
    body: JSON.stringify({ message, signature, public_key: publicKey }),
  })
}
