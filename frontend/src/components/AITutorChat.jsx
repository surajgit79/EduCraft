import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'

export default function AITutorChat({ onClose }) {
  const { userData } = useAuthStore()
  const { 
    chatHistory, 
    addChatMessage, 
    clearChatHistory,
    sessionData 
  } = useGameStore()
  
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSend = async () => {
    if (!message.trim() || loading) return
    
    const userMessage = message.trim()
    setMessage('')
    addChatMessage('user', userMessage)
    
    setLoading(true)
    try {
      const response = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: sessionData?.subject || 'Math',
          grade: sessionData?.grade || '5',
          message: userMessage,
          chat_history: chatHistory.slice(-10)
        })
      })
      
      const data = await response.json()
      addChatMessage('tutor', data.reply)
    } catch (error) {
      console.error('Error in tutor chat:', error)
      addChatMessage('tutor', "I'm here to help! Ask me anything about your current subject.")
    }
    setLoading(false)
  }

  const handleKeyPress = (e) => {
    e.stopPropagation()
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleKeyDown = (e) => {
    e.stopPropagation()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-4 right-4 w-80 md:w-96 bg-[#2a2a4e] pixel-border flex flex-col"
      style={{ maxHeight: '500px' }}
    >
      <div className="p-3 border-b border-gray-600 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center">
            <span className="text-sm">📚</span>
          </div>
          <div>
            <p className="text-xs text-white">AI Tutor</p>
            <p className="text-[10px] text-gray-400">{sessionData?.subject || 'Math'}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '320px' }}>
        {chatHistory.length === 0 && (
          <div className="text-center text-gray-400 text-xs py-4">
            <p>Hi! I'm your AI tutor.</p>
            <p>Ask me anything about {sessionData?.subject || 'this subject'}!</p>
          </div>
        )}
        
        {chatHistory.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-2 text-xs ${
              msg.role === 'user' 
                ? 'bg-[#4CAF50] text-white' 
                : 'bg-[#1a1a2e] text-gray-200'
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a2e] p-2 text-xs text-gray-400">
              Thinking...
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t border-gray-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 bg-[#1a1a2e] border border-gray-600 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4CAF50]"
          />
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="bg-[#4CAF50] px-3 py-2 text-xs text-white hover:bg-[#45a049] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </motion.div>
  )
}
