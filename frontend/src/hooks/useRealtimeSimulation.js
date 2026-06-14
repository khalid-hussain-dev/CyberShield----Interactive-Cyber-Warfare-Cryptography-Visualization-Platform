import { useEffect, useMemo, useRef, useState } from 'react'
import { createRealtimeSocket } from '../services/realtimeSocket'


export default function useRealtimeSimulation({ selectedScenarioId, defenseEnabled, launched }) {
  const socketRef = useRef(null)
  const [connection, setConnection] = useState({
    status: 'connecting',
    message: 'Opening realtime channel',
  })
  const [liveState, setLiveState] = useState(null)
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const socket = createRealtimeSocket()
    socketRef.current = socket

    function handleConnect() {
      setConnection({
        status: 'online',
        message: 'Realtime channel connected',
      })
    }

    function handleDisconnect() {
      setConnection({
        status: 'offline',
        message: 'Realtime channel disconnected',
      })
    }

    function handleStatus(status) {
      setConnection({
        status: status.connected ? 'online' : 'offline',
        message: status.message,
      })
    }

    function handleState(state) {
      setLiveState(state)
    }

    function handleEvent(event) {
      setEvents((current) => [...current.slice(-24), event])
    }

    function handleError(response) {
      setError(response.message)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('realtime:status', handleStatus)
    socket.on('simulation:state', handleState)
    socket.on('simulation:event', handleEvent)
    socket.on('simulation:error', handleError)
    socket.connect()

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    const socket = socketRef.current

    if (!socket || !socket.connected) {
      return
    }

    setEvents([])
    setError(null)
    socket.emit('simulation:start', {
      scenario_id: selectedScenarioId,
      defense_enabled: defenseEnabled,
      launched,
    })
  }, [defenseEnabled, launched, selectedScenarioId, connection.status])

  const hackerLogs = useMemo(
    () => events.filter((event) => event.channel === 'hacker').map((event) => event.message),
    [events],
  )
  const defenderLogs = useMemo(
    () =>
      events
        .filter((event) => event.channel === 'defender')
        .map((event) => (event.severity ? `[${event.time}] ${event.severity}: ${event.message}` : event.message)),
    [events],
  )

  return {
    connection,
    state: liveState,
    events,
    error,
    hackerLogs,
    defenderLogs,
  }
}
