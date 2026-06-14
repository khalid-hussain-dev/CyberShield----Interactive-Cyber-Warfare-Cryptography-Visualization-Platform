/**
 * useDuelSocket.js
 * Custom hook for the 2-player duel Socket.IO connection.
 * Connects to the /duel namespace through the Vite proxy (no CORS).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const INITIAL_STATE = {
  connected: false,
  room: null,
  role: null,
  catalogues: null,
  roundResult: null,
  gameOver: null,
  error: null,
  attackLocked: false,
  defenseLocked: false,
}

export default function useDuelSocket({ token, roomCode }) {
  const [state, setState] = useState(INITIAL_STATE)
  const socketRef = useRef(null)

  const patch = useCallback((update) => {
    setState((prev) => ({ ...prev, ...update }))
  }, [])

  useEffect(() => {
    if (!token || !roomCode) return

    // Connect to /duel namespace via Vite proxy.
    // The Vite proxy maps /socket.io → http://127.0.0.1:5000/socket.io
    // Flask-SocketIO then routes the /duel namespace internally.
    const socket = io('/duel', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      patch({ connected: true, error: null })
      socket.emit('duel:join', { room_code: roomCode, token })
    })

    socket.on('disconnect', () => patch({ connected: false }))

    socket.on('duel:connected', () => {})

    socket.on('duel:joined', (data) => {
      patch({
        room: data.room,
        role: data.role,
        catalogues: data.catalogues,
        error: null,
      })
    })

    socket.on('duel:player_joined', (data) => {
      patch({ room: data.room })
    })

    socket.on('duel:state_update', (data) => {
      patch({ room: data.room })
    })

    socket.on('duel:attack_locked', (data) => {
      patch({ room: data.room, attackLocked: true })
    })

    socket.on('duel:defense_locked', (data) => {
      patch({ room: data.room, defenseLocked: true })
    })

    socket.on('duel:round_start', (data) => {
      patch({
        room: data.room,
        roundResult: null,
        attackLocked: false,
        defenseLocked: false,
      })
    })

    socket.on('duel:round_result', (data) => {
      patch({
        room: data.room,
        roundResult: data,
        attackLocked: false,
        defenseLocked: false,
      })
    })

    socket.on('duel:game_over', (data) => {
      patch({ gameOver: data, room: data.room })
    })

    socket.on('duel:error', (data) => {
      patch({ error: data.message })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, roomCode, patch])

  const sendReady = useCallback(() => {
    socketRef.current?.emit('duel:ready', { room_code: roomCode, token })
  }, [roomCode, token])

  const sendAttack = useCallback((attackType) => {
    if (state.attackLocked) return
    patch({ attackLocked: true })
    socketRef.current?.emit('duel:attack', {
      room_code: roomCode,
      token,
      attack_type: attackType,
    })
  }, [roomCode, token, state.attackLocked, patch])

  const sendDefense = useCallback((defenseType) => {
    if (state.defenseLocked) return
    patch({ defenseLocked: true })
    socketRef.current?.emit('duel:defend', {
      room_code: roomCode,
      token,
      defense_type: defenseType,
    })
  }, [roomCode, token, state.defenseLocked, patch])

  return { state, sendReady, sendAttack, sendDefense }
}
