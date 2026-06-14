import { useState } from 'react'
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react'

const initialForm = {
  username: 'student_operator',
  email: 'student@example.com',
  password: 'SecurePass123',
}

export default function AuthGate({ session, onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState(session.message)

  function updateField(fieldName, value) {
    setForm((current) => ({
      ...current,
      [fieldName]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage(mode === 'login' ? 'Authenticating operator' : 'Registering operator')

    try {
      const response = mode === 'login' ? await onLogin(form) : await onRegister(form)
      setMessage(response.message)
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <main className="grid min-h-screen bg-cyber-background text-cyber-text lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)]">
      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <span className="rounded-lg border border-cyber-blue/50 bg-cyber-blue/10 p-2 text-cyber-blue shadow-glowBlue">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-cyber-muted">CyberShield Access</p>
              <h1 className="text-2xl font-semibold">Secure Operator Login</h1>
            </div>
          </div>

          <form className="rounded-lg border border-cyber-border bg-cyber-panel p-5 shadow-panel" onSubmit={handleSubmit}>
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-md border border-cyber-border bg-cyber-background p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition ${
                  mode === 'login' ? 'bg-cyber-blue text-white' : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition ${
                  mode === 'register' ? 'bg-cyber-blue text-white' : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Register
              </button>
            </div>

            {mode === 'register' ? (
              <label className="mb-4 block">
                <span className="text-xs font-semibold uppercase text-cyber-muted">Username</span>
                <input
                  value={form.username}
                  onChange={(event) => updateField('username', event.target.value)}
                  className="mt-1 h-11 w-full rounded-md border border-cyber-border bg-cyber-background px-3 text-sm text-cyber-text outline-none transition focus:border-cyber-blue"
                />
              </label>
            ) : null}

            <label className="mb-4 block">
              <span className="text-xs font-semibold uppercase text-cyber-muted">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-cyber-border bg-cyber-background px-3 text-sm text-cyber-text outline-none transition focus:border-cyber-blue"
              />
            </label>

            <label className="mb-5 block">
              <span className="text-xs font-semibold uppercase text-cyber-muted">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-cyber-border bg-cyber-background px-3 text-sm text-cyber-text outline-none transition focus:border-cyber-blue"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-cyber-blue/50 bg-cyber-blue px-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              {mode === 'login' ? <LogIn className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
              {mode === 'login' ? 'Login' : 'Register'}
            </button>

            <p className="mt-4 min-h-5 text-sm text-cyber-muted">{message}</p>
          </form>
        </div>
      </section>

      <section className="relative hidden min-h-screen items-center justify-center overflow-hidden border-l border-cyber-border bg-[#070B15] px-10 lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="relative flex flex-col items-center text-center">
          <span className="rounded-full border border-cyber-blue/40 bg-cyber-blue/10 p-8 shadow-[0_0_80px_rgba(59,130,246,0.28)]">
            <img src="/logos/login_logo.png" alt="CyberShield" className="h-72 w-72 rounded-full object-contain" />
          </span>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-cyber-muted">Interactive Cyber Warfare Platform</p>
        </div>
      </section>
    </main>
  )
}
