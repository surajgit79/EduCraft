import { useState, useEffect, useCallback, useRef } from 'react'
import { rtdb } from '../utils/firebase'
import { ref, set, onValue, push, update, remove, onDisconnect, serverTimestamp } from 'firebase/database'

const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY || 
                   import.meta.env.VITE_FIREBASE_API_KEY.startsWith('your_')

export function useMultiplayer(roomCode, userId, userName) {
  const [players, setPlayers] = useState({})
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [activePlayer, setActivePlayer] = useState(null)
  const [gameState, setGameState] = useState('waiting')
  const [isHost, setIsHost] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  
  const playerRef = useRef(null)
  const roomRef = useRef(null)

  useEffect(() => {
    if (!roomCode || !userId || isDemoMode) {
      setConnectionStatus('demo')
      return
    }

    setConnectionStatus('connecting')
    roomRef.current = ref(rtdb, `rooms/${roomCode}`)
    playerRef.current = ref(rtdb, `rooms/${roomCode}/players/${userId}`)

    const initializeRoom = async () => {
      try {
        const snapshot = await new Promise((resolve) => {
          onValue(roomRef.current, (snapshot) => {
            resolve(snapshot)
          }, { onlyOnce: true })
        })

        if (!snapshot.exists()) {
          await set(roomRef.current, {
            code: roomCode,
            createdAt: serverTimestamp(),
            host: userId,
            state: 'waiting',
            currentQuestion: null,
            activePlayer: null
          })
          setIsHost(true)
        }

        await set(playerRef.current, {
          id: userId,
          name: userName || 'Player',
          hp: 100,
          xp: 0,
          level: 1,
          score: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          joinedAt: serverTimestamp(),
          isReady: true
        })

        onDisconnect(playerRef.current).remove()

        setConnectionStatus('connected')
      } catch (error) {
        console.error('Error initializing room:', error)
        setConnectionStatus('error')
      }
    }

    initializeRoom()

    const unsubscribePlayers = onValue(ref(rtdb, `rooms/${roomCode}/players`), (snapshot) => {
      if (snapshot.exists()) {
        setPlayers(snapshot.val())
      }
    })

    const unsubscribeGameState = onValue(ref(rtdb, `rooms/${roomCode}/state`), (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val())
      }
    })

    const unsubscribeQuestion = onValue(ref(rtdb, `rooms/${roomCode}/currentQuestion`), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentQuestion(snapshot.val())
      }
    })

    const unsubscribeActivePlayer = onValue(ref(rtdb, `rooms/${roomCode}/activePlayer`), (snapshot) => {
      if (snapshot.exists()) {
        setActivePlayer(snapshot.val())
      }
    })

    return () => {
      unsubscribePlayers()
      unsubscribeGameState()
      unsubscribeQuestion()
      unsubscribeActivePlayer()
      if (playerRef.current) {
        remove(playerRef.current).catch(() => {})
      }
    }
  }, [roomCode, userId, userName])

  const updatePlayerStats = useCallback(async (stats) => {
    if (!playerRef.current || isDemoMode) return
    
    try {
      await update(playerRef.current, {
        ...stats,
        lastUpdated: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating player stats:', error)
    }
  }, [])

  const startGame = useCallback(async () => {
    if (!roomRef.current || !isHost || isDemoMode) return

    try {
      await update(roomRef.current, {
        state: 'playing',
        startedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }, [isHost])

  const setQuestion = useCallback(async (question) => {
    if (!roomRef.current || isDemoMode) return

    try {
      await update(roomRef.current, {
        currentQuestion: question,
        questionStartTime: serverTimestamp()
      })
    } catch (error) {
      console.error('Error setting question:', error)
    }
  }, [])

  const setActivePlayerTurn = useCallback(async (playerId) => {
    if (!roomRef.current || isDemoMode) return

    try {
      await update(roomRef.current, {
        activePlayer: playerId
      })
    } catch (error) {
      console.error('Error setting active player:', error)
    }
  }, [])

  const answerQuestion = useCallback(async (answer, isCorrect) => {
    if (!playerRef.current || !roomRef.current || isDemoMode) return

    try {
      const playerSnapshot = await new Promise((resolve) => {
        onValue(playerRef.current, (snapshot) => {
          resolve(snapshot)
        }, { onlyOnce: true })
      })

      const currentStats = playerSnapshot.val() || {}
      
      const updates = {
        score: (currentStats.score || 0) + (isCorrect ? 100 : 0),
        xp: (currentStats.xp || 0) + (isCorrect ? 15 : 0),
        correctAnswers: (currentStats.correctAnswers || 0) + (isCorrect ? 1 : 0),
        totalQuestions: (currentStats.totalQuestions || 0) + 1,
        hp: isDemoMode ? Math.max(0, (currentStats.hp || 100) - (isCorrect ? 0 : 20)) : currentStats.hp,
        lastAnswerTime: serverTimestamp()
      }

      await update(playerRef.current, updates)

      await update(ref(rtdb, `rooms/${roomCode}/answers/${userId}`), {
        answer,
        isCorrect,
        timestamp: serverTimestamp()
      })

    } catch (error) {
      console.error('Error answering question:', error)
    }
  }, [roomCode, userId])

  const leaveRoom = useCallback(async () => {
    if (playerRef.current) {
      await remove(playerRef.current).catch(() => {})
    }
  }, [])

  const getLeaderboard = useCallback(() => {
    return Object.values(players).sort((a, b) => (b.score || 0) - (a.score || 0))
  }, [players])

  return {
    players,
    currentQuestion,
    activePlayer,
    gameState,
    isHost,
    connectionStatus,
    updatePlayerStats,
    startGame,
    setQuestion,
    setActivePlayerTurn,
    answerQuestion,
    leaveRoom,
    getLeaderboard
  }
}

export function createRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
