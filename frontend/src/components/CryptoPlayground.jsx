import { useState, useEffect } from 'react'
import { ArrowLeft, Copy, Check, ShieldAlert, KeyRound, Key, Hash, FileSignature } from 'lucide-react'
import {
  aesEncrypt,
  aesDecrypt,
  rsaKeypair,
  rsaEncrypt,
  rsaDecrypt,
  sha256Hash,
  signatureSign,
  signatureVerify,
} from '../services/cryptoApi'
import StatusPill from './StatusPill'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-8 items-center gap-1.5 rounded border border-cyber-border bg-cyber-panelSoft px-2.5 text-[11px] font-semibold text-cyber-text transition hover:border-cyber-blue"
    >
      {copied ? <Check className="h-3 w-3 text-cyber-green" /> : <Copy className="h-3 w-3 text-cyber-blue" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function CryptoPlayground({ onBack }) {
  const [activeTab, setActiveTab] = useState('aes')
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // AES States
  const [aesPlain, setAesPlain] = useState('')
  const [aesKey, setAesKey] = useState('')
  const [aesNonce, setAesNonce] = useState('')
  const [aesCipher, setAesCipher] = useState('')
  const [aesDecrypted, setAesDecrypted] = useState('')

  // RSA States
  const [rsaPubKey, setRsaPubKey] = useState('')
  const [rsaPrivKey, setRsaPrivKey] = useState('')
  const [rsaPlain, setRsaPlain] = useState('')
  const [rsaCipher, setRsaCipher] = useState('')
  const [rsaDecrypted, setRsaDecrypted] = useState('')

  // Hashing States
  const [hashInput, setHashInput] = useState('')
  const [hashOutput, setHashOutput] = useState('')

  // Signature States
  const [sigMsg, setSigMsg] = useState('')
  const [sigPrivKey, setSigPrivKey] = useState('')
  const [sigPubKey, setSigPubKey] = useState('')
  const [sigOutput, setSigOutput] = useState('')
  const [sigVerifyMsg, setSigVerifyMsg] = useState('')
  const [sigVerifyInput, setSigVerifyInput] = useState('')
  const [sigVerifyResult, setSigVerifyResult] = useState(null)

  // Clear notifications on tab switch
  useEffect(() => {
    setError(null)
    setSuccessMsg(null)
  }, [activeTab])

  // Real-time hashing
  useEffect(() => {
    if (!hashInput) {
      setHashOutput('')
      return
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await sha256Hash(hashInput)
        setHashOutput(response.data.digest)
      } catch (err) {
        console.error(err)
      }
    }, 150)

    return () => clearTimeout(delayDebounce)
  }, [hashInput])

  const triggerError = (msg) => {
    setError(msg)
    setSuccessMsg(null)
    setTimeout(() => setError(null), 5000)
  }

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg)
    setError(null)
    setTimeout(() => setSuccessMsg(null), 5000)
  }

  // AES Operations
  const handleAesEncrypt = async () => {
    if (!aesPlain) return triggerError('Plaintext is required.')
    try {
      const response = await aesEncrypt(aesPlain, aesKey || null)
      setAesCipher(response.data.ciphertext)
      setAesKey(response.data.key)
      setAesNonce(response.data.nonce)
      triggerSuccess('Symmetric encryption complete.')
    } catch (err) {
      triggerError(err.message)
    }
  }

  const handleAesDecrypt = async () => {
    if (!aesCipher || !aesKey || !aesNonce) {
      return triggerError('Ciphertext, Key, and Nonce are all required for AES-GCM decryption.')
    }
    try {
      const response = await aesDecrypt(aesCipher, aesKey, aesNonce)
      setAesDecrypted(response.data.plaintext)
      triggerSuccess('Symmetric decryption complete.')
    } catch (err) {
      triggerError(err.message)
    }
  }

  // RSA Operations
  const handleGenerateRsaKeys = async () => {
    try {
      const response = await rsaKeypair()
      setRsaPubKey(response.data.public_key)
      setRsaPrivKey(response.data.private_key)
      triggerSuccess('Asymmetric RSA-2048 key-pair generated.')
    } catch (err) {
      triggerError(err.message)
    }
  }

  const handleRsaEncrypt = async () => {
    if (!rsaPlain) return triggerError('Plaintext is required.')
    if (!rsaPubKey) return triggerError('RSA Public Key is required.')
    try {
      const response = await rsaEncrypt(rsaPlain, rsaPubKey)
      setRsaCipher(response.data.ciphertext)
      triggerSuccess('Asymmetric encryption complete.')
    } catch (err) {
      triggerError(err.message)
    }
  }

  const handleRsaDecrypt = async () => {
    if (!rsaCipher) return triggerError('Ciphertext is required.')
    if (!rsaPrivKey) return triggerError('RSA Private Key is required.')
    try {
      const response = await rsaDecrypt(rsaCipher, rsaPrivKey)
      setRsaDecrypted(response.data.plaintext)
      triggerSuccess('Asymmetric decryption complete.')
    } catch (err) {
      triggerError(err.message)
    }
  }

  // Generate RSA keys and populate BOTH RSA tab + Signature tab states
  const handleGenerateRsaKeysForSig = async () => {
    try {
      const response = await rsaKeypair()
      const pub = response.data.public_key
      const priv = response.data.private_key
      // Fill RSA tab
      setRsaPubKey(pub)
      setRsaPrivKey(priv)
      // Fill Signature tab
      setSigPubKey(pub)
      setSigPrivKey(priv)
      triggerSuccess('RSA-2048 key pair generated — keys loaded into both RSA and Signatures tabs.')
    } catch (err) {
      triggerError(err.message)
    }
  }

  // Signature Operations
  const handleSign = async () => {

    if (!sigMsg) return triggerError('Message is required to sign.')
    if (!sigPrivKey) return triggerError('RSA Private Key is required to sign.')
    try {
      const response = await signatureSign(sigMsg, sigPrivKey)
      setSigOutput(response.data.signature)
      // Autofill verification fields to improve user UX
      setSigVerifyMsg(sigMsg)
      setSigVerifyInput(response.data.signature)
      triggerSuccess('Digital signature generated.')
    } catch (err) {
      triggerError(err.message)
    }
  }

  const handleVerify = async () => {
    if (!sigVerifyMsg) return triggerError('Message is required.')
    if (!sigVerifyInput) return triggerError('Signature hash is required.')
    if (!sigPubKey) return triggerError('RSA Public Key is required.')
    try {
      const response = await signatureVerify(sigVerifyMsg, sigVerifyInput, sigPubKey)
      setSigVerifyResult(response.data.valid)
      if (response.data.valid) {
        triggerSuccess('Signature is VALID. Message matches and has not been altered.')
      } else {
        triggerError('Signature is INVALID. Key mismatch or payload tampered.')
      }
    } catch (err) {
      triggerError(err.message)
    }
  }

  return (
    <main className="min-h-screen bg-cyber-background px-4 py-4 text-cyber-text sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
        {/* Header */}
        <header className="rounded-lg border border-cyber-border bg-cyber-panel px-4 py-4 shadow-panel">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-cyber-border bg-cyber-panelSoft text-cyber-muted transition hover:border-cyber-blue hover:text-cyber-blue"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase text-cyber-muted">Interactive Sandbox Workspace</p>
                <h1 className="text-xl font-semibold text-cyber-text">Cryptography Playground</h1>
              </div>
            </div>
            <StatusPill tone="blue">Sandbox Active</StatusPill>
          </div>
        </header>

        {/* Global Notifications */}
        {error && (
          <div className="rounded-lg border border-cyber-red/30 bg-cyber-red/10 p-3 text-xs text-red-200 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-cyber-red shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg border border-cyber-green/30 bg-cyber-green/10 p-3 text-xs text-green-200">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
          {/* Navigation Rails */}
          <div className="flex flex-col gap-2 rounded-lg border border-cyber-border bg-cyber-panel p-3">
            <p className="px-2 text-[10px] font-bold tracking-wider text-cyber-muted uppercase mb-1">Algorithms</p>
            <button
              type="button"
              onClick={() => setActiveTab('aes')}
              className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-xs font-semibold transition text-left border ${
                activeTab === 'aes' ? 'border-cyber-blue bg-cyber-panelSoft text-cyber-text' : 'border-transparent text-cyber-muted hover:bg-cyber-panelSoft/50 hover:text-cyber-text'
              }`}
            >
              <KeyRound className="h-4 w-4 text-cyber-blue" />
              AES-256-GCM
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rsa')}
              className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-xs font-semibold transition text-left border ${
                activeTab === 'rsa' ? 'border-cyber-blue bg-cyber-panelSoft text-cyber-text' : 'border-transparent text-cyber-muted hover:bg-cyber-panelSoft/50 hover:text-cyber-text'
              }`}
            >
              <Key className="h-4 w-4 text-cyber-blue" />
              RSA-2048 Asymmetric
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hash')}
              className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-xs font-semibold transition text-left border ${
                activeTab === 'hash' ? 'border-cyber-blue bg-cyber-panelSoft text-cyber-text' : 'border-transparent text-cyber-muted hover:bg-cyber-panelSoft/50 hover:text-cyber-text'
              }`}
            >
              <Hash className="h-4 w-4 text-cyber-blue" />
              SHA-256 Hashing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signature')}
              className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-xs font-semibold transition text-left border ${
                activeTab === 'signature' ? 'border-cyber-blue bg-cyber-panelSoft text-cyber-text' : 'border-transparent text-cyber-muted hover:bg-cyber-panelSoft/50 hover:text-cyber-text'
              }`}
            >
              <FileSignature className="h-4 w-4 text-cyber-blue" />
              Digital Signatures
            </button>
          </div>

          {/* Playground Workspaces */}
          <div className="rounded-lg border border-cyber-border bg-cyber-panel p-4 shadow-panel">
            {/* AES Sandbox */}
            {activeTab === 'aes' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-cyber-text">AES-256-GCM Symmetric Sandbox</h2>
                  <p className="text-xs text-cyber-muted mt-1">Symmetric algorithm providing both confidentiality (AES) and authentication tags (GCM).</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Encrypt Block */}
                  <div className="space-y-3 rounded-lg border border-cyber-border/60 bg-cyber-background/30 p-3">
                    <p className="text-xs font-bold text-cyber-text uppercase tracking-wider">Encrypt Pipeline</p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">Plaintext Payload</label>
                      <input
                        type="text"
                        placeholder="Enter text to encrypt..."
                        value={aesPlain}
                        onChange={(e) => setAesPlain(e.target.value)}
                        className="w-full rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs text-cyber-text outline-none focus:border-cyber-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">Symmetric Key (Base64 - 32 Bytes)</label>
                      <input
                        type="text"
                        placeholder="Leave blank to auto-generate..."
                        value={aesKey}
                        onChange={(e) => setAesKey(e.target.value)}
                        className="w-full rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs font-mono text-cyber-text outline-none focus:border-cyber-blue"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAesEncrypt}
                      className="w-full rounded bg-cyber-blue py-2 text-xs font-bold text-cyber-background transition hover:bg-blue-600"
                    >
                      Run Encrypt
                    </button>
                  </div>

                  {/* Decrypt Block */}
                  <div className="space-y-3 rounded-lg border border-cyber-border/60 bg-cyber-background/30 p-3">
                    <p className="text-xs font-bold text-cyber-text uppercase tracking-wider">Decrypt Pipeline</p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">Ciphertext (Base64)</label>
                      <input
                        type="text"
                        placeholder="Ciphertext payload..."
                        value={aesCipher}
                        onChange={(e) => setAesCipher(e.target.value)}
                        className="w-full rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs font-mono text-cyber-text outline-none focus:border-cyber-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">GCM Nonce (Base64 - 12 Bytes)</label>
                      <input
                        type="text"
                        placeholder="Nonce value..."
                        value={aesNonce}
                        onChange={(e) => setAesNonce(e.target.value)}
                        className="w-full rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs font-mono text-cyber-text outline-none focus:border-cyber-blue"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAesDecrypt}
                      className="w-full rounded bg-cyber-green py-2 text-xs font-bold text-cyber-background transition hover:bg-green-600"
                    >
                      Run Decrypt
                    </button>
                  </div>
                </div>

                {/* Outputs */}
                {(aesCipher || aesDecrypted) && (
                  <div className="space-y-3 border-t border-cyber-border pt-4 text-xs">
                    <p className="font-semibold text-cyber-text">Pipeline Results</p>
                    {aesCipher && (
                      <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-3 font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-cyber-muted uppercase">Ciphertext Output</span>
                          <CopyButton text={aesCipher} />
                        </div>
                        <p className="text-cyber-text break-all mt-1">{aesCipher}</p>
                      </div>
                    )}
                    {aesDecrypted && (
                      <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-cyber-muted uppercase font-mono">Decrypted Plaintext</span>
                          <CopyButton text={aesDecrypted} />
                        </div>
                        <p className="text-cyber-green font-semibold mt-1">{aesDecrypted}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* RSA Sandbox */}
            {activeTab === 'rsa' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-cyber-text">RSA-2048 Asymmetric Sandbox</h2>
                    <p className="text-xs text-cyber-muted mt-1">Asymmetric standard using public key for encryption and private key for decryption.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateRsaKeys}
                    className="rounded border border-cyber-blue bg-cyber-panelSoft px-3 py-1.5 text-xs font-semibold text-cyber-blue transition hover:bg-cyber-blue hover:text-cyber-background"
                  >
                    Generate RSA Keys
                  </button>
                </div>

                {/* Keys display */}
                {rsaPubKey && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
                    <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-2.5 font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-cyber-muted uppercase">PEM Public Key</span>
                        <CopyButton text={rsaPubKey} />
                      </div>
                      <textarea
                        readOnly
                        value={rsaPubKey}
                        className="w-full h-24 bg-transparent outline-none border-none text-[10px] resize-none text-cyber-muted font-mono leading-4"
                      />
                    </div>
                    <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-2.5 font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-cyber-muted uppercase">PEM Private Key</span>
                        <CopyButton text={rsaPrivKey} />
                      </div>
                      <textarea
                        readOnly
                        value={rsaPrivKey}
                        className="w-full h-24 bg-transparent outline-none border-none text-[10px] resize-none text-cyber-muted font-mono leading-4"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Encrypt Block */}
                  <div className="space-y-3 rounded-lg border border-cyber-border/60 bg-cyber-background/30 p-3">
                    <p className="text-xs font-bold text-cyber-text uppercase tracking-wider">RSA Encrypt Pipeline</p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">Plaintext Payload</label>
                      <input
                        type="text"
                        placeholder="Enter text to encrypt..."
                        value={rsaPlain}
                        onChange={(e) => setRsaPlain(e.target.value)}
                        className="w-full rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs text-cyber-text outline-none focus:border-cyber-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">RSA Public Key (PEM format)</label>
                      <textarea
                        placeholder="Paste PEM Public Key here..."
                        value={rsaPubKey}
                        onChange={(e) => setRsaPubKey(e.target.value)}
                        className="w-full h-16 rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-[10px] font-mono text-cyber-text outline-none focus:border-cyber-blue resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRsaEncrypt}
                      className="w-full rounded bg-cyber-blue py-2 text-xs font-bold text-cyber-background transition hover:bg-blue-600"
                    >
                      RSA Encrypt
                    </button>
                  </div>

                  {/* Decrypt Block */}
                  <div className="space-y-3 rounded-lg border border-cyber-border/60 bg-cyber-background/30 p-3">
                    <p className="text-xs font-bold text-cyber-text uppercase tracking-wider">RSA Decrypt Pipeline</p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">Ciphertext (Base64)</label>
                      <input
                        type="text"
                        placeholder="Ciphertext payload..."
                        value={rsaCipher}
                        onChange={(e) => setRsaCipher(e.target.value)}
                        className="w-full rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs font-mono text-cyber-text outline-none focus:border-cyber-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">RSA Private Key (PEM format)</label>
                      <textarea
                        placeholder="Paste PEM Private Key here..."
                        value={rsaPrivKey}
                        onChange={(e) => setRsaPrivKey(e.target.value)}
                        className="w-full h-16 rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-[10px] font-mono text-cyber-text outline-none focus:border-cyber-blue resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRsaDecrypt}
                      className="w-full rounded bg-cyber-green py-2 text-xs font-bold text-cyber-background transition hover:bg-green-600"
                    >
                      RSA Decrypt
                    </button>
                  </div>
                </div>

                {/* Outputs */}
                {(rsaCipher || rsaDecrypted) && (
                  <div className="space-y-3 border-t border-cyber-border pt-4 text-xs">
                    <p className="font-semibold text-cyber-text">Pipeline Results</p>
                    {rsaCipher && (
                      <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-3 font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-cyber-muted uppercase">Asymmetric Ciphertext</span>
                          <CopyButton text={rsaCipher} />
                        </div>
                        <p className="text-cyber-text break-all mt-1">{rsaCipher}</p>
                      </div>
                    )}
                    {rsaDecrypted && (
                      <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-cyber-muted uppercase font-mono">RSA Decrypted Result</span>
                          <CopyButton text={rsaDecrypted} />
                        </div>
                        <p className="text-cyber-green font-semibold mt-1">{rsaDecrypted}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SHA-256 Hashing */}
            {activeTab === 'hash' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-cyber-text">SHA-256 Hashing Sandbox</h2>
                  <p className="text-xs text-cyber-muted mt-1">Creates a 256-bit unique cryptographic digest. Unidirectional (cannot be decrypted).</p>
                </div>

                <div className="space-y-3 rounded-lg border border-cyber-border/60 bg-cyber-background/30 p-3">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-cyber-muted uppercase">Input Payload</label>
                    <textarea
                      placeholder="Type message here to hash in real-time..."
                      value={hashInput}
                      onChange={(e) => setHashInput(e.target.value)}
                      className="w-full h-24 rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs text-cyber-text outline-none focus:border-cyber-blue"
                    />
                  </div>
                </div>

                {hashOutput && (
                  <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-3 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-cyber-muted uppercase">SHA-256 Digest (64 Hex Characters)</span>
                      <CopyButton text={hashOutput} />
                    </div>
                    <p className="text-cyber-blue font-bold break-all mt-1">{hashOutput}</p>
                  </div>
                )}
              </div>
            )}

            {/* Digital Signatures */}
            {activeTab === 'signature' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-cyber-text">RSA Digital Signatures Sandbox</h2>
                    <p className="text-xs text-cyber-muted mt-1">Verifies authenticity and integrity by signing hashes using a private key and verifying using a public key.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateRsaKeysForSig}
                    className="shrink-0 rounded border border-cyber-blue bg-cyber-panelSoft px-3 py-1.5 text-xs font-semibold text-cyber-blue transition hover:bg-cyber-blue hover:text-cyber-background"
                  >
                    Generate Key Pair
                  </button>
                </div>

                {/* Inline key display — visible once keys are generated */}
                {sigPubKey && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
                    <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-2.5 font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-cyber-muted uppercase">PEM Public Key (auto-filled below)</span>
                        <CopyButton text={sigPubKey} />
                      </div>
                      <textarea
                        readOnly
                        value={sigPubKey}
                        className="w-full h-20 bg-transparent outline-none border-none text-[10px] resize-none text-cyber-muted font-mono leading-4"
                      />
                    </div>
                    <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-2.5 font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-cyber-muted uppercase">PEM Private Key (auto-filled below)</span>
                        <CopyButton text={sigPrivKey} />
                      </div>
                      <textarea
                        readOnly
                        value={sigPrivKey}
                        className="w-full h-20 bg-transparent outline-none border-none text-[10px] resize-none text-cyber-muted font-mono leading-4"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  {/* Sign Section */}
                  <div className="space-y-3 rounded-lg border border-cyber-border/60 bg-cyber-background/30 p-3">
                    <p className="text-xs font-bold text-cyber-text uppercase tracking-wider">Signing Pipeline</p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">Message to Sign</label>
                      <input
                        type="text"
                        placeholder="Message content..."
                        value={sigMsg}
                        onChange={(e) => setSigMsg(e.target.value)}
                        className="w-full rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs text-cyber-text outline-none focus:border-cyber-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">PEM Private Key</label>
                      <textarea
                        placeholder="Paste RSA Private Key (PEM format)..."
                        value={sigPrivKey}
                        onChange={(e) => setSigPrivKey(e.target.value)}
                        className="w-full h-16 rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-[10px] font-mono text-cyber-text outline-none focus:border-cyber-blue resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSign}
                      className="w-full rounded bg-cyber-blue py-2 text-xs font-bold text-cyber-background transition hover:bg-blue-600"
                    >
                      Sign Payload
                    </button>
                  </div>

                  {/* Verify Section */}
                  <div className="space-y-3 rounded-lg border border-cyber-border/60 bg-cyber-background/30 p-3">
                    <p className="text-xs font-bold text-cyber-text uppercase tracking-wider">Verification Pipeline</p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">Original Message</label>
                      <input
                        type="text"
                        placeholder="Original message content..."
                        value={sigVerifyMsg}
                        onChange={(e) => setSigVerifyMsg(e.target.value)}
                        className="w-full rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs text-cyber-text outline-none focus:border-cyber-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">Signature Hash (Base64)</label>
                      <input
                        type="text"
                        placeholder="Signature hash to verify..."
                        value={sigVerifyInput}
                        onChange={(e) => setSigVerifyInput(e.target.value)}
                        className="w-full rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-xs font-mono text-cyber-text outline-none focus:border-cyber-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-cyber-muted uppercase">PEM Public Key</label>
                      <textarea
                        placeholder="Paste RSA Public Key (PEM format)..."
                        value={sigPubKey}
                        onChange={(e) => setSigPubKey(e.target.value)}
                        className="w-full h-16 rounded border border-cyber-border bg-[#070B15] px-3 py-2 text-[10px] font-mono text-cyber-text outline-none focus:border-cyber-blue resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerify}
                      className="w-full rounded bg-cyber-green py-2 text-xs font-bold text-cyber-background transition hover:bg-green-600"
                    >
                      Verify Signature
                    </button>
                  </div>
                </div>

                {/* Signature Output */}
                {sigOutput && (
                  <div className="space-y-2 rounded border border-cyber-border bg-[#070B15] p-3 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-cyber-muted uppercase font-sans">Generated Signature (Base64)</span>
                      <CopyButton text={sigOutput} />
                    </div>
                    <p className="text-cyber-blue break-all mt-1">{sigOutput}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
