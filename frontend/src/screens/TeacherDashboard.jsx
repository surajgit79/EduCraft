import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { 
  collection, query, where, getDocs, doc, getDoc
} from 'firebase/firestore'
import { db } from '../utils/firebase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { userData, logout } = useAuthStore()
  const [classCode, setClassCode] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (userData?.uid) {
      loadClassData()
    }
  }, [userData])

  const loadClassData = async () => {
    try {
      const userRef = doc(db, 'users', userData.uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists() && userSnap.data().class_code) {
        setClassCode(userSnap.data().class_code)
      } else {
        const newCode = generateClassCode()
        setClassCode(newCode)
      }

      const studentsList = []
      const studentsRef = collection(db, 'users')
      const q = query(studentsRef, where('role', '==', 'student'))
      const snapshot = await getDocs(q)
      
      for (const studentDoc of snapshot.docs) {
        const studentData = studentDoc.data()
        const progressData = {}
        
        const subjects = ['Math', 'Science', 'History', 'Geography', 'English']
        for (const subject of subjects) {
          const progressRef = doc(db, 'progress', studentDoc.id, 'subjects', subject)
          const progressSnap = await getDoc(progressRef)
          if (progressSnap.exists()) {
            progressData[subject] = progressSnap.data()
          }
        }

        studentsList.push({
          id: studentDoc.id,
          ...studentData,
          progress: progressData
        })
      }
      
      setStudents(studentsList)
    } catch (error) {
      console.error('Error loading class data:', error)
    }
    setLoading(false)
  }

  const generateClassCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    return code
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const generateInsight = async () => {
    setGenerating(true)
    try {
      const studentStats = students.map(s => ({
        name: s.name,
        subject_stats: Object.entries(s.progress || {}).reduce((acc, [subj, data]) => {
          acc[subj] = { xp: data.total_xp || 0, accuracy: data.accuracy || 0 }
          return acc
        }, {}),
        weak_topics: Object.values(s.progress || {}).flatMap(p => p.weak_topics || [])
      }))

      const response = await fetch('/api/class-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentStats })
      })

      const data = await response.json()
      setAiInsight(data.insight)
    } catch (error) {
      console.error('Error generating insight:', error)
      setAiInsight('Unable to generate insight at this time.')
    }
    setGenerating(false)
  }

  const chartData = subjects => {
    const data = []
    const subjectsList = ['Math', 'Science', 'History', 'Geography', 'English']
    subjectsList.forEach(subject => {
      const totalXp = students.reduce((sum, s) => sum + (s.progress[subject]?.total_xp || 0), 0)
      const avgAccuracy = students.length > 0 
        ? students.reduce((sum, s) => sum + (s.progress[subject]?.accuracy || 0), 0) / students.length 
        : 0
      data.push({ subject, totalXp: Math.round(totalXp), accuracy: Math.round(avgAccuracy * 100) })
    })
    return data
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl text-[#4CAF50] text-shadow">Teacher Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">Welcome, {userData?.name}</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-white">
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2a2a4e] p-6 pixel-border"
          >
            <h3 className="text-sm text-gray-400 mb-2">Class Code</h3>
            <p className="text-3xl text-[#FFD700] tracking-widest">{classCode}</p>
            <p className="text-xs text-gray-500 mt-2">Share this code with your students</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#2a2a4e] p-6 pixel-border"
          >
            <h3 className="text-sm text-gray-400 mb-2">Total Students</h3>
            <p className="text-3xl text-[#4ECDC4]">{students.length}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#2a2a4e] p-6 pixel-border"
          >
            <h3 className="text-sm text-gray-400 mb-2">Class Average XP</h3>
            <p className="text-3xl text-[#4CAF50]">
              {students.length > 0 
                ? Math.round(students.reduce((sum, s) => {
                    const totalXp = Object.values(s.progress || {}).reduce((a, b) => a + (b.total_xp || 0), 0)
                    return sum + totalXp
                  }, 0) / students.length)
                : 0}
            </p>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={generateInsight}
          disabled={generating || students.length === 0}
          className="pixel-button mb-8"
        >
          {generating ? 'Analyzing...' : 'Generate AI Class Insight'}
        </motion.button>

        {aiInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#4CAF50]/20 border border-[#4CAF50] p-4 mb-8"
          >
            <h3 className="text-sm text-[#4CAF50] mb-2">AI Insight</h3>
            <p className="text-sm">{aiInsight}</p>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#2a2a4e] p-4 pixel-border"
          >
            <h3 className="text-sm mb-4">XP by Subject</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="subject" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip contentStyle={{ background: '#2a2a4e', border: '2px solid #000' }} />
                <Bar dataKey="totalXp" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#2a2a4e] p-4 pixel-border"
          >
            <h3 className="text-sm mb-4">Accuracy by Subject</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="subject" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#2a2a4e', border: '2px solid #000' }} />
                <Line type="monotone" dataKey="accuracy" stroke="#4ECDC4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#2a2a4e] p-4 pixel-border overflow-x-auto"
        >
          <h3 className="text-sm mb-4">Student Progress</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-600">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Grade</th>
                <th className="text-left py-2">Math XP</th>
                <th className="text-left py-2">Science XP</th>
                <th className="text-left py-2">History XP</th>
                <th className="text-left py-2">Geo XP</th>
                <th className="text-left py-2">English XP</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="border-b border-gray-700">
                  <td className="py-2">{student.name}</td>
                  <td className="py-2">{student.grade || '-'}</td>
                  <td className="py-2">{student.progress.Math?.total_xp || 0}</td>
                  <td className="py-2">{student.progress.Science?.total_xp || 0}</td>
                  <td className="py-2">{student.progress.History?.total_xp || 0}</td>
                  <td className="py-2">{student.progress.Geography?.total_xp || 0}</td>
                  <td className="py-2">{student.progress.English?.total_xp || 0}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    No students linked yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  )
}
