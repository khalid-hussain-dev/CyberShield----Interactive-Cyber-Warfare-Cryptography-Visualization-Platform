import { useEffect, useState } from 'react'
import { runSimulation } from '../services/simulationApi'

const initialComparison = {
  insecure: null,
  secure: null,
  status: 'loading',
  error: null,
  generatedAt: null,
}

export default function useScenarioComparison(selectedScenarioId) {
  const [comparison, setComparison] = useState(initialComparison)

  useEffect(() => {
    let active = true

    async function loadComparison() {
      setComparison((current) => ({
        ...current,
        status: 'loading',
        error: null,
      }))

      try {
        const [insecureResponse, secureResponse] = await Promise.all([
          runSimulation({ scenarioId: selectedScenarioId, defenseEnabled: false, launched: true }),
          runSimulation({ scenarioId: selectedScenarioId, defenseEnabled: true, launched: true }),
        ])

        if (!active) {
          return
        }

        setComparison({
          insecure: insecureResponse.data,
          secure: secureResponse.data,
          status: 'ready',
          error: null,
          generatedAt: new Date(),
        })
      } catch (error) {
        if (!active) {
          return
        }

        setComparison({
          insecure: null,
          secure: null,
          status: 'error',
          error: error.message,
          generatedAt: null,
        })
      }
    }

    loadComparison()

    return () => {
      active = false
    }
  }, [selectedScenarioId])

  return comparison
}
