import { useEffect, useMemo, useState } from 'react'
import { alerts, attackLogs, baseMetrics, defenseLogs, defenses, scenarios } from '../data/mockSecurityData'
import { getScenarios, runSimulation } from '../services/simulationApi'


function fallbackState(selectedScenarioId, defenseEnabled = false, launched = false) {
  const scenario = scenarios.find((item) => item.id === selectedScenarioId) ?? scenarios[0]

  if (!launched) {
    return {
      scenario,
      launched: false,
      defense_enabled: defenseEnabled,
      attack_success: false,
      channel: {
        status: 'standby',
        label: 'Simulation Standby',
        algorithm: defenseEnabled ? 'Defense ready' : 'None',
      },
      metrics: [
        { label: 'Active Attacks', value: '00', trend: 'waiting for launch', tone: 'blue' },
        { label: 'Protected Channels', value: defenseEnabled ? '01' : '00', trend: 'operator controlled', tone: 'green' },
        { label: 'Packets Observed', value: '000', trend: 'standby', tone: 'blue' },
        { label: 'Alert Priority', value: 'P3', trend: 'no active incident', tone: 'yellow' },
      ],
      packets: [],
      alerts: [],
      attack_logs: ['[standby] Simulation waiting for operator launch'],
      defense_logs: ['[standby] Defender console online'],
      defenses,
    }
  }

  return {
    scenario,
    launched,
    defense_enabled: defenseEnabled,
    attack_success: true,
    channel: {
      status: 'mock',
      label: 'Mock Scenario',
      algorithm: 'Frontend fallback',
    },
    metrics: baseMetrics,
    packets: [],
    alerts,
    attack_logs: attackLogs,
    defense_logs: defenseLogs,
    defenses,
  }
}


export default function useSimulationData({ selectedScenarioId, defenseEnabled, launched }) {
  const [scenarioList, setScenarioList] = useState(scenarios)
  const [simulationState, setSimulationState] = useState(() => fallbackState(selectedScenarioId, defenseEnabled, launched))
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadScenarios() {
      try {
        const response = await getScenarios()

        if (!active) {
          return
        }

        setScenarioList(response.data.scenarios)
      } catch (requestError) {
        if (!active) {
          return
        }

        setError(requestError.message)
      }
    }

    loadScenarios()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadSimulation() {
      setStatus('loading')

      try {
        const response = await runSimulation({
          scenarioId: selectedScenarioId,
          defenseEnabled,
          launched,
        })

        if (!active) {
          return
        }

        setSimulationState(response.data)
        setStatus('ready')
        setError(null)
      } catch (requestError) {
        if (!active) {
          return
        }

        setSimulationState(fallbackState(selectedScenarioId, defenseEnabled, launched))
        setStatus('fallback')
        setError(requestError.message)
      }
    }

    loadSimulation()

    return () => {
      active = false
    }
  }, [defenseEnabled, launched, selectedScenarioId])

  const selectedScenario = useMemo(
    () => simulationState.scenario ?? scenarioList.find((scenario) => scenario.id === selectedScenarioId) ?? scenarioList[0],
    [scenarioList, selectedScenarioId, simulationState.scenario],
  )

  return {
    scenarios: scenarioList,
    selectedScenario,
    state: simulationState,
    status,
    error,
  }
}
