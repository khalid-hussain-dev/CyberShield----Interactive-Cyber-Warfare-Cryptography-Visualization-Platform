import { apiRequest } from './apiClient'


export function getScenarios() {
  return apiRequest('/api/scenarios')
}


export function runSimulation({ scenarioId, defenseEnabled, launched }) {
  return apiRequest('/api/simulations/run', {
    method: 'POST',
    body: JSON.stringify({
      scenario_id: scenarioId,
      defense_enabled: defenseEnabled,
      launched,
    }),
  })
}

export function saveAuditReport(reportData, token) {
  return apiRequest('/api/reports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(reportData),
  })
}

export function getAuditReports(token) {
  return apiRequest('/api/reports', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
}
