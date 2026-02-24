import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import SyllabusUpload from '../components/SyllabusUpload'

export default function ModeSelection() {
  const navigate = useNavigate()
  const { setSession, syllabusData, setSyllabusData } = useGameStore()
  
  const [mode, setMode] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleUploadComplete = (data) => {
    setShowUpload(false)
    setUploadComplete(true)
  }

  const handleContinueWithSyllabus = () => {
    const chapter = syllabusData?.chapters?.find(c => c.id === 1)
    
    setSession({
      subject: syllabusData.subject || 'Math',
      grade: syllabusData.grade || '5',
      mode: 'syllabus',
      syllabusId: syllabusData.syllabusId,
      chapterId: 1,
      chapterTitle: chapter?.title || 'Chapter 1',
      chapterContent: chapter?.content || ''
    })
    
    navigate('/game')
  }

  const handleContinueDefault = () => {
    setSession({
      subject: 'Math',
      grade: '5',
      mode: 'default',
      syllabusId: null,
      chapterId: null,
      chapterTitle: null,
      chapterContent: ''
    })
    
    navigate('/game')
  }

  const handleBack = () => {
    setSyllabusData(null)
    setUploadComplete(false)
    setShowUpload(false)
    setMode(null)
    navigate('/home')
  }

  // Show syllabus confirmation after upload
  if (uploadComplete && syllabusData) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handleBack} 
            className="text-xs text-gray-400 hover:text-white mb-4"
          >
            ← Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2a2a4e] p-6 pixel-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">✅</span>
              <div>
                <h1 className="text-xl text-white">Syllabus Analyzed!</h1>
                <p className="text-xs text-gray-400">
                  {syllabusData.totalChapters} chapters detected from {syllabusData.filename}
                </p>
              </div>
            </div>
            
            <div className="bg-[#1a1a2e] p-4 rounded mb-4">
              <p className="text-sm text-gray-400 mb-2">Detected:</p>
              <p className="text-white">📚 {syllabusData.subject} | Grade {syllabusData.grade}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinueWithSyllabus}
              className="w-full py-4 pixel-button bg-[#4CAF50] text-lg"
            >
              Start Learning →
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Show upload screen
  if (showUpload) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => { setShowUpload(false); setMode(null) }} 
            className="text-xs text-gray-400 hover:text-white mb-4"
          >
            ← Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-xl text-white mb-2 text-shadow">Upload Your Textbook</h1>
            <p className="text-sm text-gray-400 mb-6">
              Our AI will automatically detect the subject, grade level, and chapters from your PDF
            </p>
            
            <SyllabusUpload onUploadComplete={handleUploadComplete} />
          </motion.div>
        </div>
      </div>
    )
  }

  // Quick Play mode
  if (mode === 'default') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => { setMode(null) }} 
            className="text-xs text-gray-400 hover:text-white mb-4"
          >
            ← Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2a2a4e] p-6 pixel-border text-center"
          >
            <div className="text-4xl mb-4">🎮</div>
            <h1 className="text-xl text-white mb-2 text-shadow">Quick Play Mode</h1>
            <p className="text-sm text-gray-400 mb-6">
              Jump right in! Questions will be generated based on general curriculum
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinueDefault}
              className="w-full py-4 pixel-button text-lg bg-[#2196F3]"
            >
              Start Playing →
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  return null
}
