import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import SyllabusUpload from '../components/SyllabusUpload'
import Header from '../components/Header'

const subjects = [
  { 
    id: 'Math', 
    name: 'Math', 
    color: 'from-blue-600 to-cyan-400', 
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.5)]',
    icon: '🔢',
    world: 'Crystal Peaks'
  },
  { 
    id: 'Science', 
    name: 'Science', 
    color: 'from-green-600 to-emerald-400', 
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.5)]',
    icon: '🔬',
    world: 'Neon Lab Zone'
  },
  { 
    id: 'History', 
    name: 'History', 
    color: 'from-amber-700 to-yellow-500', 
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
    icon: '📜',
    world: 'Ancient Ruins'
  },
  { 
    id: 'Geography', 
    name: 'Geography', 
    color: 'from-teal-600 to-cyan-400', 
    glow: 'shadow-[0_0_30px_rgba(8,145,178,0.5)]',
    icon: '🌍',
    world: 'Terra Nova'
  },
  { 
    id: 'English', 
    name: 'English', 
    color: 'from-purple-600 to-pink-400', 
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
    icon: '📚',
    world: 'Storybook Library'
  }
]

export default function WorldSelection() {
  const navigate = useNavigate()
  const { userData } = useAuthStore()
  const { setWorldData, setRoomCode, setSession, setDifficulty, setSyllabusData, syllabusData } = useGameStore()
  
  const [step, setStep] = useState('select-mode') // 'select-mode', 'quick-play', 'syllabus-upload', 'syllabus-chapters'
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedGrade, setSelectedGrade] = useState(userData?.grade || '5')
  const [mode, setMode] = useState('solo')
  const [roomCode, setRoomCodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState(1)

  const handleBackToMode = () => {
    setSyllabusData(null)
    setSelectedSubject(null)
    setSelectedChapter(1)
    setStep('select-mode')
  }

  const handleEnterWorld = async () => {
    setLoading(true)

    const isSyllabus = step === 'syllabus-chapters' && syllabusData
    const subject = isSyllabus ? (syllabusData?.subject || 'Math') : (selectedSubject?.id || 'Math')
    const grade = isSyllabus ? (syllabusData?.grade || 5) : parseInt(selectedGrade)
    const mode = isSyllabus ? 'syllabus' : 'default'

    try {
      const response = await fetch('/api/generate-world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject, 
          grade
        })
      })

      const worldData = await response.json()
      setWorldData(worldData)
      
      let code = null
      
      if (!isSyllabus && mode !== 'solo') {
        if (roomCode.trim()) {
          code = roomCode.trim().toUpperCase()
        } else {
          code = Math.random().toString(36).substring(2, 8).toUpperCase()
        }
      }
      
      setRoomCode(code)
      
      let chapterContent = ''
      let chapterTitle = null
      let chapterId = null
      let syllabusId = null
      
      if (isSyllabus) {
        const chapter = syllabusData.chapters?.find(c => c.id === selectedChapter)
        chapterContent = chapter?.content || ''
        chapterTitle = chapter?.title || `Chapter ${selectedChapter}`
        chapterId = selectedChapter
        syllabusId = syllabusData.syllabusId
      }
      
      setSession({
        subject,
        grade,
        mode,
        roomCode: code,
        syllabusId,
        chapterId,
        chapterTitle,
        chapterContent
      })
      
      setDifficulty('medium')
      navigate('/game')
    } catch (error) {
      console.error('Error generating world:', error)
    }
    setLoading(false)
  }

  // Step 1: Select Mode (Quick Play vs Syllabus)
  if (step === 'select-mode') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-4 md:p-8">
        <Header />
        <div className="max-w-2xl mx-auto pt-28">
          <button onClick={() => navigate('/home')} className="text-xs text-gray-400 hover:text-white mb-8">
            ← Back to Dashboard
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2a2a4e] p-8 pixel-border text-center"
          >
            <h1 className="text-2xl text-white mb-2 text-shadow">Choose Learning Mode</h1>
            <p className="text-sm text-gray-400 mb-8">How would you like to learn today?</p>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('quick-play')}
                className="w-full py-8 pixel-border bg-gradient-to-r from-[#2196F3] to-[#1565C0]"
              >
                <div className="text-4xl mb-2">🎮</div>
                <p className="text-xl text-white">Quick Play</p>
                <p className="text-xs text-gray-300 mt-1">Practice with general questions across subjects</p>
              </motion.button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#2a2a4e] text-gray-400">OR</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('syllabus-upload')}
                className="w-full py-8 pixel-border bg-gradient-to-r from-[#4CAF50] to-[#2E7D32]"
              >
                <div className="text-4xl mb-2">📚</div>
                <p className="text-xl text-white">Upload Syllabus</p>
                <p className="text-xs text-gray-300 mt-1">Learn from your textbook with AI-generated questions</p>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Step 2: Quick Play - Select Subject
  if (step === 'quick-play') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-4 md:p-8">
        <Header />
        <div className="max-w-6xl mx-auto pt-28">
          <button onClick={() => setStep('select-mode')} className="text-xs text-gray-400 hover:text-white mb-8">
            ← Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl text-[#4CAF50] text-shadow mb-2">Quick Play</h1>
            <p className="text-xs text-gray-400 mb-8">Select a subject to begin your adventure</p>

            <div className="grid md:grid-cols-5 gap-4 mb-8">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSubject(subject)}
                  className={`relative bg-gradient-to-br ${subject.color} p-6 pixel-border cursor-pointer transition-all
                    ${selectedSubject?.id === subject.id ? subject.glow : ''}
                    ${selectedSubject?.id === subject.id ? 'ring-4 ring-white' : ''}`}
                >
                  <div className="text-4xl mb-3 text-center">{subject.icon}</div>
                  <p className="text-sm text-center text-white text-shadow">{subject.name}</p>
                  <p className="text-xs text-center text-white/70 mt-1">{subject.world}</p>
                </motion.div>
              ))}
            </div>

            {selectedSubject && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#2a2a4e] p-6 pixel-border"
              >
                <h2 className="text-lg text-white mb-4 text-shadow">Game Settings</h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Grade Level</label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="pixel-input w-full"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Game Mode</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => { setMode('solo'); setRoomCodeInput('') }}
                        className={`w-full py-2 text-xs pixel-border ${mode === 'solo' ? 'bg-[#4CAF50]' : 'bg-[#3a3a5e]'}`}
                      >
                        Solo
                      </button>
                      <button
                        onClick={() => setMode('co-op')}
                        className={`w-full py-2 text-xs pixel-border ${mode === 'co-op' ? 'bg-[#4CAF50]' : 'bg-[#3a3a5e]'}`}
                      >
                        Co-op
                      </button>
                      <button
                        onClick={() => setMode('competitive')}
                        className={`w-full py-2 text-xs pixel-border ${mode === 'competitive' ? 'bg-[#4CAF50]' : 'bg-[#3a3a5e]'}`}
                      >
                        Competitive
                      </button>
                    </div>
                  </div>

                  {mode !== 'solo' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        {mode === 'co-op' ? 'Room Code (optional)' : 'Room Code'}
                      </label>
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                        placeholder={mode === 'co-op' ? 'Leave empty to create new' : 'Enter code to join'}
                        className="pixel-input w-full"
                        maxLength={6}
                      />
                      {mode === 'competitive' && !roomCode && (
                        <p className="text-[10px] text-gray-500 mt-1">A new room will be created</p>
                      )}
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEnterWorld}
                  disabled={loading || !selectedSubject}
                  className="w-full mt-6 py-4 pixel-button text-lg"
                >
                  {loading ? 'Loading World...' : `Enter ${selectedSubject?.name || 'World'}`}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  // Step 3: Syllabus Upload
  if (step === 'syllabus-upload') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-4 md:p-8">
        <Header />
        <div className="max-w-2xl mx-auto pt-28">
          <button onClick={handleBackToMode} className="text-xs text-gray-400 hover:text-white mb-8">
            ← Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl text-white mb-2 text-shadow">Upload Your Syllabus</h1>
            <p className="text-sm text-gray-400 mb-8">
              Our AI will analyze your textbook and create questions for each chapter
            </p>
            
            <div className="bg-[#2a2a4e] p-6 pixel-border mb-6">
              <SyllabusUpload onUploadComplete={() => setStep('syllabus-chapters')} />
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Step 4: Syllabus - Select Chapter & Start Game
  if (step === 'syllabus-chapters' && syllabusData) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-4 md:p-8">
        <Header />
        <div className="max-w-2xl mx-auto pt-28">
          <button onClick={() => setStep('syllabus-upload')} className="text-xs text-gray-400 hover:text-white mb-8">
            ← Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2a2a4e] p-6 pixel-border mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">✅</span>
              <div>
                <h1 className="text-xl text-white">Syllabus Ready!</h1>
                <p className="text-xs text-gray-400">
                  {syllabusData.totalChapters} chapters | {syllabusData.subject} - Grade {syllabusData.grade}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#2a2a4e] p-6 pixel-border mb-6"
          >
            <h2 className="text-lg text-white mb-4 text-shadow">Select Chapter to Start</h2>
            
            <div className="space-y-3 mb-6">
              {syllabusData.chapters?.map((ch, idx) => (
                <motion.button
                  key={ch.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChapter(ch.id)}
                  className={`w-full p-4 pixel-border text-left flex justify-between items-center ${
                    selectedChapter === ch.id ? 'bg-[#4CAF50]' : 'bg-[#1a1a2e]'
                  }`}
                >
                  <div>
                    <span className="text-[#4CAF50] mr-2">Ch.{ch.id}</span>
                    <span className="text-white">{ch.title}</span>
                  </div>
                  {selectedChapter === ch.id && <span>✓</span>}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEnterWorld}
              disabled={loading}
              className="w-full py-4 pixel-button text-lg bg-[#4CAF50]"
            >
              {loading ? 'Loading World...' : `Start Chapter ${selectedChapter}`}
            </motion.button>
          </motion.div>

          <p className="text-xs text-gray-500 text-center">
            Each chapter is a level. Complete all quests to unlock the next chapter!
          </p>
        </div>
      </div>
    )
  }

  return null
}
