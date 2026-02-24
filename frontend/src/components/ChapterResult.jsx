import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function ChapterResult({ results, onContinue, onExit }) {
  const { chapterTitle, score, totalQuestions, correctAnswers, accuracy, nextChapter, hasMoreChapters, mode, subject } = results

  const getGrade = () => {
    if (accuracy >= 90) return { grade: 'A+', color: '#FFD700', emoji: '🌟' }
    if (accuracy >= 80) return { grade: 'A', color: '#FFD700', emoji: '🌟' }
    if (accuracy >= 70) return { grade: 'B', color: '#4CAF50', emoji: '👍' }
    if (accuracy >= 60) return { grade: 'C', color: '#2196F3', emoji: '📚' }
    if (accuracy >= 50) return { grade: 'D', color: '#FF9800', emoji: '💪' }
    return { grade: 'F', color: '#f44336', emoji: '📖' }
  }

  const { grade, color, emoji } = getGrade()
  const isSyllabusMode = mode === 'syllabus'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-[#2a2a4e] p-8 pixel-border max-w-md w-full text-center"
      >
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-2xl text-white mb-2 text-shadow">
          {isSyllabusMode ? 'Chapter Complete!' : 'Level Complete!'}
        </h2>
        <p className="text-sm text-gray-400 mb-2">
          {subject} - {isSyllabusMode ? chapterTitle : 'Default Mode'}
        </p>
        <p className="text-sm text-gray-400 mb-6">{chapterTitle}</p>

        <div className="bg-[#1a1a2e] rounded-lg p-4 mb-6">
          <div className="flex justify-center items-center mb-4">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
              style={{ backgroundColor: color + '30', border: `3px solid ${color}` }}
            >
              {grade}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-400">Score</p>
              <p className="text-[#FFD700] text-lg font-bold">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Accuracy</p>
              <p className="text-white text-lg font-bold">{accuracy}%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Correct</p>
              <p className="text-green-500 text-lg font-bold">{correctAnswers}/{totalQuestions}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">XP Earned</p>
              <p className="text-[#FFD700] text-lg font-bold">+{score * 2}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {hasMoreChapters && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinue}
              className="w-full py-3 pixel-button text-lg bg-[#4CAF50]"
            >
              Continue to Chapter {nextChapter} →
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExit}
            className="w-full py-3 pixel-button text-lg bg-[#3a3a5e]"
          >
            Exit to Home
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
