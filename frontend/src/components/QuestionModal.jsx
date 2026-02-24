import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { GAME_CONFIG } from '../constants/gameConstants'

export default function QuestionModal() {
  const { 
    currentEntity, 
    currentQuestion, 
    setShowQuestion,
    setCurrentQuestion,
    addXp,
    addCorrectAnswer,
    addWrongAnswer,
    takeDamage,
    heal,
    difficulty,
    setDifficulty,
    weakTopics,
    sessionData,
    markEntityCompleted,
    attemptedEntities,
    markEntityAttempted,
    completedEntities
  } = useGameStore()
  
  const { user } = useAuthStore()

  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.QUESTION_TIMER)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setShowResult(false)
    setSelectedAnswer(null)
    setFeedback('')
    setTimeLeft(GAME_CONFIG.QUESTION_TIMER)
    setTimerActive(false)
    fetchQuestion()
  }, [currentEntity?.entityId])

  useEffect(() => {
    if (!loading && !showResult && timeLeft > 0 && timerActive) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    } else if (timeLeft === 0 && !showResult && timerActive) {
      handleTimeUp()
    }
  }, [timeLeft, showResult, timerActive, loading])

  const fetchQuestion = async () => {
    setLoading(true)
    console.log('[DEBUG] Fetching question with sessionData:', sessionData, 'entity:', currentEntity)
    try {
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: sessionData?.subject || 'Math',
          grade: sessionData?.grade || '5',
          difficulty,
          interaction_type: currentEntity?.type || 'enemy',
          entity_id: currentEntity?.entityId || '',
          entity_name: currentEntity?.name || '',
          weak_topics: weakTopics,
          syllabus_id: sessionData?.syllabusId || null,
          chapter_id: sessionData?.chapterId || null,
          chapter_content: sessionData?.chapterContent || '',
          attempted_entities: attemptedEntities,
          user_id: user?.uid || 'anonymous'
        })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      console.log('[DEBUG] Received question:', data)
      setCurrentQuestion(data)
      
      if (currentEntity?.entityId && !attemptedEntities.includes(currentEntity.entityId)) {
        markEntityAttempted(currentEntity.entityId)
      }
    } catch (error) {
      console.error('Error fetching question:', error)
      setCurrentQuestion({
        question: "What is 5 + 3?",
        options: ["6", "7", "8", "9"],
        correct_index: 2,
        explanation: "5 + 3 = 8"
      })
      
      if (currentEntity?.entityId && !attemptedEntities.includes(currentEntity.entityId)) {
        markEntityAttempted(currentEntity.entityId)
      }
    }
    setLoading(false)
    setTimerActive(true)
  }

  const handleAnswer = (index) => {
    if (showResult || !currentQuestion) return
    setSelectedAnswer(index)
    
    const isCorrect = index === currentQuestion.correct_index
    
    if (isCorrect) {
      setFeedback('Correct! 🎉')
      const xpGain = GAME_CONFIG.XP_REWARDS[difficulty] || GAME_CONFIG.XP_REWARDS.medium
      
      const currentCorrect = useGameStore.getState().playerStats.correctAnswers
      const currentTotal = useGameStore.getState().playerStats.totalQuestions
      const newTotal = currentTotal + 1
      const newCorrect = currentCorrect + 1
      const accuracy = newTotal > 0 ? newCorrect / newTotal : 0
      
      addXp(xpGain)
      addCorrectAnswer()
      heal(GAME_CONFIG.HEAL_AMOUNT)
      
      if (accuracy >= 0.8) setDifficulty('hard')
      else if (accuracy >= 0.5) setDifficulty('medium')
      else setDifficulty('easy')
      
      if (currentEntity?.entityId && !completedEntities.includes(currentEntity.entityId)) {
        markEntityCompleted(currentEntity.entityId)
      }
    } else {
      setFeedback(`Wrong! The correct answer was: ${currentQuestion.options[currentQuestion.correct_index]}`)
      addWrongAnswer(currentQuestion.question)
      takeDamage(GAME_CONFIG.DAMAGE_WRONG)
      setDifficulty('easy')
    }
    
    setShowResult(true)
    setTimerActive(false)
    
    timerRef.current = setTimeout(() => {
      setShowQuestion(false)
    }, 2500)
  }

  const handleTimeUp = () => {
    setFeedback("Time's up!")
    takeDamage(GAME_CONFIG.DAMAGE_TIMEOUT)
    addWrongAnswer(currentQuestion?.question)
    setShowResult(true)
    setTimerActive(false)
    
    timerRef.current = setTimeout(() => {
      setShowQuestion(false)
    }, 2500)
  }

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setShowQuestion(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        className="bg-[#2a2a4e] p-6 pixel-border max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-sm text-gray-400">
              {currentEntity?.type === 'enemy' && '⚔️ Fight Enemy'}
              {currentEntity?.type === 'resource' && '⛏️ Mine Resource'}
              {currentEntity?.type === 'npc' && '📜 Quest'}
            </h3>
            <p className="text-lg text-white mt-1">{currentEntity?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Time Left</p>
            <p className={`text-2xl ${timeLeft <= 10 ? 'text-red-500' : 'text-[#4CAF50]'}`}>
              {timeLeft}s
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-[#4CAF50] animate-pulse">Loading question...</div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-white text-sm mb-4">{currentQuestion?.question}</p>
              <div className="space-y-2">
                {currentQuestion?.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={showResult}
                    className={`w-full text-left p-3 pixel-border text-xs transition-all
                      ${selectedAnswer === index 
                        ? (index === currentQuestion?.correct_index ? 'bg-green-600' : 'bg-red-600')
                        : 'bg-[#1a1a2e] hover:bg-[#3a3a5e]'
                      }
                      ${showResult && index === currentQuestion?.correct_index ? 'bg-green-600' : ''}
                    `}
                  >
                    <span className="text-[#4CAF50] mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 text-center text-sm ${selectedAnswer === currentQuestion?.correct_index ? 'bg-green-600/20' : 'bg-red-600/20'}`}
                >
                  <p className="mb-2">{feedback}</p>
                  <p className="text-gray-400 text-xs">{currentQuestion?.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
