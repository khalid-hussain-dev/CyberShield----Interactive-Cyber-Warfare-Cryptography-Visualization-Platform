const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''


export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const payload = await response.json().catch(() => {
    throw new Error('CyberShield API returned an unreadable response')
  })

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'CyberShield API request failed')
  }

  return payload
}


export function getBackendHealth() {
  return apiRequest('/api/health')
}
