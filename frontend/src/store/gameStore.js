import { create } from 'zustand'
import { GAME_CONFIG } from '../constants/gameConstants'

const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY || 
                   import.meta.env.VITE_FIREBASE_API_KEY.startsWith('your_')

const basePlayerStats = {
  hp: GAME_CONFIG.MAX_HP,
  xp: 0,
  level: 1,
  correctAnswers: 0,
  totalQuestions: 0,
  score: 0
}

export const useGameStore = create((set, get) => ({
  worldData: null,
  currentQuestion: null,
  sessionData: null,
  playerStats: { ...basePlayerStats },
  chatHistory: [],
  weakTopics: [],
  difficulty: 'medium',
  roomCode: null,
  isMultiplayer: false,
  isHost: false,
  multiplayerPlayers: {},
  leaderboard: {},
  showQuestion: false,
  currentEntity: null,
  questionTimer: GAME_CONFIG.QUESTION_TIMER,
  wrongAnswers: [],
  loadingQuestion: false,
  completedEntities: [],
  attemptedEntities: [],
  activePlayerTurn: null,
  gameStarted: false,
  syllabusData: null,
  currentChapter: 1,
  totalChapters: 0,
  chapterQuestions: [],
  chapterResults: null,

  setSyllabusData: (data) => set({ 
    syllabusData: data,
    totalChapters: data.totalChapters || 0,
    currentChapter: 1
  }),

  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  
  addChapterQuestion: (question) => set((state) => ({
    chapterQuestions: [...state.chapterQuestions, question]
  })),

  clearChapterQuestions: () => set({ chapterQuestions: [] }),

  setChapterResults: (results) => set({ chapterResults: results }),

  setWorldData: (data) => set({ worldData: data }),
  
  setSession: (sessionData) => set({ sessionData }),
  
  setRoomCode: (code) => set({ roomCode: code, isMultiplayer: !!code }),
  
  setDifficulty: (difficulty) => set({ difficulty }),

  addXp: (amount) => set((state) => {
    if (typeof amount !== 'number' || amount < 0) return state
    const newXp = state.playerStats.xp + amount
    const newLevel = Math.floor(newXp / GAME_CONFIG.XP_PER_LEVEL) + 1
    return { 
      playerStats: { 
        ...state.playerStats, 
        xp: newXp, 
        level: newLevel 
      } 
    }
  }),

  addCorrectAnswer: () => set((state) => ({
    playerStats: {
      ...state.playerStats,
      correctAnswers: state.playerStats.correctAnswers + 1,
      totalQuestions: state.playerStats.totalQuestions + 1
    }
  })),

  addWrongAnswer: (question) => set((state) => ({
    playerStats: {
      ...state.playerStats,
      totalQuestions: state.playerStats.totalQuestions + 1
    },
    wrongAnswers: [...state.wrongAnswers, question]
  })),

  takeDamage: (amount) => set((state) => ({
    playerStats: {
      ...state.playerStats,
      hp: Math.max(0, state.playerStats.hp - amount)
    }
  })),

  heal: (amount) => set((state) => ({
    playerStats: {
      ...state.playerStats,
      hp: Math.min(GAME_CONFIG.MAX_HP, state.playerStats.hp + amount)
    }
  })),

  setShowQuestion: (show, entity = null) => set({ showQuestion: show, currentEntity: entity }),
  
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  
  setQuestionTimer: (timer) => set({ questionTimer: timer }),

  addChatMessage: (role, content) => set((state) => ({
    chatHistory: [...state.chatHistory, { role, content, timestamp: Date.now() }]
  })),

  markEntityCompleted: (entityId) => set((state) => ({
    completedEntities: [...state.completedEntities, entityId]
  })),

  markEntityAttempted: (entityId) => set((state) => {
    if (state.attemptedEntities.includes(entityId)) return state
    return { attemptedEntities: [...state.attemptedEntities, entityId] }
  }),

  isEntityCompleted: (entityId) => get().completedEntities.includes(entityId),

  clearChatHistory: () => set({ chatHistory: [] }),

  updateLeaderboard: (scores) => set({ leaderboard: scores }),

  setMultiplayerPlayers: (players) => set({ multiplayerPlayers: players }),
  
  setActivePlayerTurn: (playerId) => set({ activePlayerTurn: playerId }),
  
  setGameStarted: (started) => set({ gameStarted: started }),
  
  setIsHost: (isHost) => set({ isHost }),

  syncPlayerStats: (stats) => set((state) => ({
    playerStats: {
      ...state.playerStats,
      ...stats
    }
  })),

  addScore: (points) => set((state) => ({
    playerStats: {
      ...state.playerStats,
      score: (state.playerStats.score || 0) + points
    }
  })),

  resetGame: () => set({
    playerStats: { ...basePlayerStats },
    showQuestion: false,
    currentEntity: null,
    wrongAnswers: [],
    chatHistory: [],
    weakTopics: [],
    completedEntities: [],
    attemptedEntities: [],
    multiplayerPlayers: {},
    gameStarted: false,
    activePlayerTurn: null,
    syllabusData: null,
    currentChapter: 1,
    totalChapters: 0,
    chapterQuestions: [],
    chapterResults: null
  }),

  resetPlayerStats: () => set({
    playerStats: { ...basePlayerStats },
    showQuestion: false,
    currentEntity: null,
    wrongAnswers: [],
    completedEntities: [],
    attemptedEntities: [],
    gameStarted: false,
    activePlayerTurn: null
  }),

  loadWeakTopics: async (uid, subject) => {
    if (isDemoMode) {
      set({ weakTopics: ['Fractions', 'Multiplication'] })
      return
    }
    
    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../utils/firebase')
      const progressRef = doc(db, 'progress', uid, 'subjects', subject)
      const progressSnap = await getDoc(progressRef)
      
      if (progressSnap.exists()) {
        const data = progressSnap.data()
        set({ weakTopics: data.weak_topics || [] })
      }
    } catch (error) {
      console.error('Error loading weak topics:', error)
    }
  },

  saveSession: async (uid, subject, grade, mode) => {
    if (isDemoMode) return true
    
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('../utils/firebase')
      
      const { playerStats, difficulty } = get()
      
      const accuracy = playerStats.totalQuestions > 0 
        ? playerStats.correctAnswers / playerStats.totalQuestions 
        : 0

      const sessionData = {
        uid,
        subject,
        grade,
        mode,
        started_at: serverTimestamp(),
        ended_at: serverTimestamp(),
        questions_answered: playerStats.totalQuestions,
        correct_answers: playerStats.correctAnswers,
        xp_earned: playerStats.xp,
        accuracy,
        difficulty_progression: [difficulty]
      }

      const sessionRef = doc(db, 'sessions', `${uid}_${Date.now()}`)
      await setDoc(sessionRef, sessionData)
      
      return true
    } catch (error) {
      console.error('Error saving session:', error)
      return false
    }
  },

  updateProgress: async (uid, subject, xp, accuracy, totalQuestions, correctAnswers) => {
    if (isDemoMode) return
    
    try {
      const { doc, getDoc, setDoc } = await import('firebase/firestore')
      const { db } = await import('../utils/firebase')
      
      const progressRef = doc(db, 'progress', uid, 'subjects', subject)
      const progressSnap = await getDoc(progressRef)
      
      let currentData = {}
      if (progressSnap.exists()) {
        currentData = progressSnap.data()
      }

      const newTotalXp = (currentData.total_xp || 0) + xp
      const newLevel = Math.floor(newTotalXp / GAME_CONFIG.XP_PER_LEVEL) + 1
      const newTotalQuestions = (currentData.total_questions || 0) + totalQuestions
      const newCorrectAnswers = (currentData.correct_answers || 0) + correctAnswers
      const newAccuracy = newTotalQuestions > 0 ? newCorrectAnswers / newTotalQuestions : 0

      await setDoc(progressRef, {
        total_xp: newTotalXp,
        level: newLevel,
        total_questions: newTotalQuestions,
        correct_answers: newCorrectAnswers,
        accuracy: newAccuracy,
        last_played: new Date().toISOString()
      }, { merge: true })
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  },

  analyzeWeakTopics: async (subject, grade) => {
    const { wrongAnswers } = get()
    if (wrongAnswers.length === 0) return []

    try {
      const response = await fetch('/api/analyze-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, grade, wrong_answers: wrongAnswers })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const data = await response.json()
      set({ weakTopics: data.weak_topics || [] })
      return data.weak_topics || []
    } catch (error) {
      console.error('Error analyzing weak topics:', error)
      return []
    }
  },

  setLoadingQuestion: (loading) => set({ loadingQuestion: loading })
}))
