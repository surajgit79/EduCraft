import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import Header from '../components/Header'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user, userData } = useAuthStore()
  const { syllabusData } = useGameStore()
  const [recentProgress, setRecentProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalStats, setTotalStats] = useState({ totalXP: 0, totalAccuracy: 0, totalQuestions: 0, chaptersCompleted: 0 })

  useEffect(() => {
    loadProgress()
  }, [user?.uid])

  const loadProgress = async () => {
    try {
      const userId = user?.uid || 'anonymous'
      const response = await fetch(`/api/get-progress?user_id=${userId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      
      const progress = []
      let totalXP = 0
      let totalAccuracySum = 0
      let accuracyCount = 0
      let chaptersCompleted = 0
      
      if (data.syllabus_progress) {
        Object.entries(data.syllabus_progress).forEach(([syllabusId, chapters]) => {
          chapters.forEach(ch => {
            progress.push({
              type: 'syllabus',
              title: ch.chapter_title,
              score: ch.score,
              accuracy: ch.accuracy,
              chapterId: ch.chapter_id,
              date: 'Recent'
            })
            totalXP += (ch.score || 0)
            if (ch.accuracy !== undefined) {
              totalAccuracySum += ch.accuracy
              accuracyCount++
            }
            chaptersCompleted++
          })
        })
      }
      
      if (data.default_progress) {
        Object.entries(data.default_progress).forEach(([key, info]) => {
          progress.push({
            type: 'default',
            title: `${info.subject} - Grade ${info.grade}`,
            score: info.total_score,
            sessions: info.sessions,
            date: 'Recent'
          })
          totalXP += (info.total_score || 0)
        })
      }
      
      const totalAccuracy = accuracyCount > 0 ? Math.round(totalAccuracySum / accuracyCount) : 0
      
      setTotalStats({
        totalXP,
        totalAccuracy,
        totalQuestions: data.total_completions || 0,
        chaptersCompleted
      })
      
      setRecentProgress(progress.slice(0, 5))
    } catch (error) {
      console.error('Error loading progress:', error)
    }
    setLoading(false)
  }

  const currentLevel = Math.floor(totalStats.totalXP / 100) + 1
  const xpForNextLevel = currentLevel * 100
  const currentLevelXP = totalStats.totalXP % 100

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="pt-24 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2a2a4e] p-6 pixel-border mb-8"
          >
            <h1 className="text-2xl text-[#4CAF50] text-shadow mb-2">
              Welcome back{userData?.name ? `, ${userData.name}` : ''}!
            </h1>
            <p className="text-xs text-gray-400">
              Continue your learning journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#2a2a4e] p-4 pixel-border"
            >
              <h3 className="text-xs text-gray-400 mb-1">Level</h3>
              <p className="text-3xl text-[#4CAF50] font-bold">{currentLevel}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>XP</span>
                  <span>{currentLevelXP}/{xpForNextLevel}</span>
                </div>
                <div className="w-full h-2 bg-[#1a1a2e] border border-black">
                  <div 
                    className="h-full bg-[#FFD700] transition-all"
                    style={{ width: `${(currentLevelXP / xpForNextLevel) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#2a2a4e] p-4 pixel-border"
            >
              <h3 className="text-xs text-gray-400 mb-1">Total XP</h3>
              <p className="text-3xl text-[#FFD700] font-bold">{totalStats.totalXP}</p>
              <p className="text-xs text-gray-400 mt-2">Earned</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#2a2a4e] p-4 pixel-border"
            >
              <h3 className="text-xs text-gray-400 mb-1">Accuracy</h3>
              <p className="text-3xl text-[#4ECDC4] font-bold">{totalStats.totalAccuracy}%</p>
              <p className="text-xs text-gray-400 mt-2">Average</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#2a2a4e] p-4 pixel-border"
            >
              <h3 className="text-xs text-gray-400 mb-1">Chapters</h3>
              <p className="text-3xl text-[#2196F3] font-bold">{totalStats.chaptersCompleted}</p>
              <p className="text-xs text-gray-400 mt-2">Completed</p>
            </motion.div>
          </div>

          {syllabusData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#2a2a4e] p-6 pixel-border mb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-white text-shadow">Syllabus Progress</h3>
                <span className="text-xs text-[#4CAF50]">{syllabusData.totalChapters} Chapters</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {syllabusData.chapters?.map((chapter, idx) => {
                  const completed = recentProgress.find(p => p.chapterId === chapter.id && p.type === 'syllabus')
                  return (
                    <div 
                      key={chapter.id}
                      className={`px-3 py-2 text-xs pixel-border ${
                        completed ? 'bg-[#4CAF50]' : 'bg-[#1a1a2e]'
                      }`}
                    >
                      {completed ? '✓' : idx + 1}. {chapter.title.substring(0, 15)}...
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/world')}
            className="w-full py-6 text-center pixel-button text-xl mb-8 bg-[#4CAF50]"
          >
            🚀 Continue Learning
          </motion.button>

          {recentProgress.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg text-white mb-4 text-shadow">Recent Activity</h2>
              <div className="space-y-3">
                {recentProgress.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#2a2a4e] p-4 pixel-border flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {item.type === 'syllabus' ? '📚' : '🎮'}
                        </span>
                        <span className="text-sm text-white">{item.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#FFD700] text-sm">+{item.score} XP</p>
                      {item.accuracy !== undefined && (
                        <p className="text-xs text-gray-400">{item.accuracy}%</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {recentProgress.length === 0 && !loading && (
            <div className="bg-[#2a2a4e] p-8 pixel-border text-center">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-lg text-white mb-2">No progress yet</h3>
              <p className="text-sm text-gray-400 mb-4">Upload your syllabus or start learning!</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/world')}
                className="pixel-button"
              >
                Get Started
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
