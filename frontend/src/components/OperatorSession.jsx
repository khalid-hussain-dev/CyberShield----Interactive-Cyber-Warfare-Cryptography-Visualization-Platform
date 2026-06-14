import { useState } from 'react'
import { LogIn, LogOut, UserPlus } from 'lucide-react'
import StatusPill from './StatusPill'

const initialForm = {
  username: 'student_operator',
  email: 'student@example.com',
  password: 'SecurePass123',
}


export default function OperatorSession({ session, onLogin, onRegister, onLogout }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const loading = session.status === 'loading' || session.status === 'checking'
  const authenticated = session.status === 'authenticated'
  const displayMessage = message || session.message

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

  if (authenticated) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-cyber-green/30 bg-cyber-green/10 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cyber-text">{session.user.username}</p>
              <p className="mt-1 truncate text-xs text-cyber-muted">{session.user.email}</p>
            </div>
            <StatusPill tone="green">{session.user.role}</StatusPill>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-cyber-border bg-cyber-panelSoft px-3 text-sm font-semibold text-cyber-text transition hover:border-cyber-yellow hover:text-cyber-yellow"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2 rounded-md border border-cyber-border bg-cyber-background p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`inline-flex h-9 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition ${
            mode === 'login' ? 'bg-cyber-blue text-white' : 'text-cyber-muted hover:text-cyber-text'
          }`}
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`inline-flex h-9 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition ${
            mode === 'register' ? 'bg-cyber-blue text-white' : 'text-cyber-muted hover:text-cyber-text'
          }`}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Register
        </button>
      </div>

      {mode === 'register' ? (
        <label className="block">
          <span className="text-xs font-semibold uppercase text-cyber-muted">Username</span>
          <input
            value={form.username}
            onChange={(event) => updateField('username', event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-cyber-border bg-cyber-background px-3 text-sm text-cyber-text outline-none transition placeholder:text-cyber-muted focus:border-cyber-blue"
          />
        </label>
      ) : null}

      <label className="block">
        <span className="text-xs font-semibold uppercase text-cyber-muted">Email</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          className="mt-1 h-10 w-full rounded-md border border-cyber-border bg-cyber-background px-3 text-sm text-cyber-text outline-none transition placeholder:text-cyber-muted focus:border-cyber-blue"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase text-cyber-muted">Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          className="mt-1 h-10 w-full rounded-md border border-cyber-border bg-cyber-background px-3 text-sm text-cyber-text outline-none transition placeholder:text-cyber-muted focus:border-cyber-blue"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-cyber-blue/50 bg-cyber-blue px-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:border-cyber-border disabled:bg-cyber-panelSoft disabled:text-cyber-muted"
      >
        {mode === 'login' ? <LogIn className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
        {loading ? 'Working' : mode === 'login' ? 'Login' : 'Register'}
      </button>

      <p className="min-h-5 text-xs text-cyber-muted">{displayMessage}</p>
    </form>
  )
}
