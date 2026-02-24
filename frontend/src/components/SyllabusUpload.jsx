import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

export default function SyllabusUpload({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const { setSyllabusData } = useGameStore()

  const handleUpload = async (file) => {
    if (!file) return
    
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      setError('Please upload a PDF or text file')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-syllabus', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setSyllabusData({
          syllabusId: data.syllabus_id,
          chapters: data.chapters,
          totalChapters: data.total_chapters,
          subject: data.detected_subject,
          grade: data.detected_grade,
          filename: file.name
        })
        onUploadComplete(data)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Failed to upload. Please try again.')
      console.error(err)
    }

    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragActive 
            ? 'border-[#4CAF50] bg-[#4CAF50]/10' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="text-[#4CAF50] animate-pulse text-lg">Extracting chapters...</div>
            <p className="text-xs text-gray-400">Please wait while we analyze your syllabus</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-2">📄</div>
            <p className="text-xs text-gray-400 mb-2">
              Drag & drop your PDF textbook here
            </p>
            <p className="text-xs text-gray-500 mb-3">or</p>
            <label className="cursor-pointer">
              <span className="text-xs text-[#4CAF50] hover:underline">
                Browse Files
              </span>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}
    </div>
  )
}
