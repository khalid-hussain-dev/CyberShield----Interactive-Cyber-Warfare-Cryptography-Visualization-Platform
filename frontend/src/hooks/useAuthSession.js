import { useEffect, useState } from 'react'
import { loadCurrentOperator, loginOperator, registerOperator } from '../services/authApi'

const TOKEN_KEY = 'cybershield.operatorToken'

const initialSession = {
  token: null,
  user: null,
  status: 'anonymous',
  message: 'No operator session',
}


function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}


function storeToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token)
}


function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}


export default function useAuthSession() {
  const [session, setSession] = useState(() => {
    const token = getStoredToken()

    return {
      ...initialSession,
      token,
      status: token ? 'checking' : 'anonymous',
    }
  })

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (!session.token) {
        return
      }

      try {
        const response = await loadCurrentOperator(session.token)

        if (!active) {
          return
        }

        setSession({
          token: session.token,
          user: response.data.user,
          status: 'authenticated',
          message: response.message,
        })
      } catch (error) {
        if (!active) {
          return
        }

        clearStoredToken()
        setSession({
          ...initialSession,
          status: 'anonymous',
          message: error.message,
        })
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [session.token])

  async function register(credentials) {
    setSession((current) => ({ ...current, status: 'loading', message: 'Registering operator' }))

    try {
      const response = await registerOperator(credentials)
      storeToken(response.data.access_token)
      setSession({
        token: response.data.access_token,
        user: response.data.user,
        status: 'authenticated',
        message: response.message,
      })
      return response
    } catch (error) {
      setSession({
        ...initialSession,
        status: 'anonymous',
        message: error.message,
      })
      throw error
    }
  }

  async function login(credentials) {
    setSession((current) => ({ ...current, status: 'loading', message: 'Authenticating operator' }))

    try {
      const response = await loginOperator(credentials)
      storeToken(response.data.access_token)
      setSession({
        token: response.data.access_token,
        user: response.data.user,
        status: 'authenticated',
        message: response.message,
      })
      return response
    } catch (error) {
      setSession({
        ...initialSession,
        status: 'anonymous',
        message: error.message,
      })
      throw error
    }
  }

  function logout() {
    clearStoredToken()
    setSession({
      ...initialSession,
      status: 'anonymous',
      message: 'Operator signed out',
    })
  }

  return {
    session,
    register,
    login,
    logout,
  }
}
