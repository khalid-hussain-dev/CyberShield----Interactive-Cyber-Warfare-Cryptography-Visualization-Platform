import { useEffect, useState } from 'react'
import { getBackendHealth } from '../services/apiClient'

const initialState = {
  status: 'checking',
  message: 'Checking backend link',
  service: null,
  version: null,
}


export default function useBackendHealth() {
  const [health, setHealth] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadHealth() {
      try {
        const response = await getBackendHealth()

        if (!active) {
          return
        }

        setHealth({
          status: 'online',
          message: response.message,
          service: response.data.service,
          version: response.data.version,
        })
      } catch (error) {
        if (!active) {
          return
        }

        setHealth({
          status: 'offline',
          message: error.message,
          service: null,
          version: null,
        })
      }
    }

    loadHealth()
    const interval = window.setInterval(loadHealth, 15000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  return health
}
