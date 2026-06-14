import { apiRequest } from './apiClient'


export function registerOperator({ username, email, password }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}


export function loginOperator({ email, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}


export function loadCurrentOperator(token) {
  return apiRequest('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
