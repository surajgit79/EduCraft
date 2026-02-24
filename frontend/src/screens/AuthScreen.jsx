import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

export default function AuthScreen() {
  const navigate = useNavigate()
  const { login, signup, loginWithGoogle, error, isDemoMode, user } = useAuthStore()
  
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [grade, setGrade] = useState('5')
  const [loading, setLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)

  useEffect(() => {
    if (user) {
      navigate('/home')
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (isDemoMode) {
      await login(email, password)
      navigate('/home')
      setLoading(false)
      return
    }
    
    if (mode === 'login') {
      const success = await login(email, password)
      if (success) navigate('/home')
    } else {
      const success = await signup(email, password, name, role, grade)
      if (success) navigate(role === 'student' ? '/home' : '/teacher')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    
    if (isDemoMode) {
      await loginWithGoogle()
      navigate('/home')
      setLoading(false)
      return
    }
    
    const result = await loginWithGoogle()
    if (result.needsSetup) {
      setPendingUser(result.user)
      setShowSetup(true)
    } else if (result.user || !result.needsSetup) {
      const userData = useAuthStore.getState().userData
      if (userData?.role === 'teacher') {
        navigate('/teacher')
      } else {
        navigate('/home')
      }
    }
    setLoading(false)
  }

  const handleSetup = async () => {
    setLoading(true)
    const success = await useAuthStore.getState().completeSetup(name, role, grade)
    if (success) {
      navigate(role === 'student' ? '/home' : '/teacher')
    }
    setLoading(false)
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#2a2a4e] p-8 pixel-border max-w-md w-full"
        >
          <h1 className="text-2xl text-center text-[#4CAF50] mb-2 text-shadow">Welcome!</h1>
          <p className="text-center text-sm text-gray-400 mb-6">Complete your profile</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pixel-input w-full"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-xs mb-2">I am a...</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-3 pixel-border ${role === 'student' ? 'bg-[#4CAF50]' : 'bg-[#3a3a5e]'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex-1 py-3 pixel-border ${role === 'teacher' ? 'bg-[#4CAF50]' : 'bg-[#3a3a5e]'}`}
                >
                  Teacher
                </button>
              </div>
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-xs mb-2">Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="pixel-input w-full"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleSetup}
              disabled={loading || !name}
              className="pixel-button w-full mt-4"
            >
              {loading ? 'Loading...' : 'Start Playing!'}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#2a2a4e] p-8 pixel-border max-w-md w-full"
      >
        <h1 className="text-3xl text-center text-[#4CAF50] mb-2 text-shadow">EduCraft</h1>
        <p className="text-center text-xs text-gray-400 mb-6">Learn, Play, Explore!</p>

        {isDemoMode && (
          <div className="bg-[#FFD700]/20 border border-[#FFD700] px-3 py-2 mb-4 text-xs text-center text-[#FFD700]">
            Demo Mode - No Firebase configured
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs ${mode === 'login' ? 'text-[#4CAF50]' : 'text-gray-400'}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-xs ${mode === 'signup' ? 'text-[#4CAF50]' : 'text-gray-400'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pixel-input w-full"
                placeholder="Your Name"
                required
              />
              <div>
                <label className="block text-xs mb-2">Role</label>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 py-2 text-xs pixel-border ${role === 'student' ? 'bg-[#4CAF50]' : 'bg-[#3a3a5e]'}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`flex-1 py-2 text-xs pixel-border ${role === 'teacher' ? 'bg-[#4CAF50]' : 'bg-[#3a3a5e]'}`}
                  >
                    Teacher
                  </button>
                </div>
              </div>
              {role === 'student' && (
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="pixel-input w-full"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              )}
            </>
          )}
          
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pixel-input w-full"
            placeholder="Email"
            required
          />
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pixel-input w-full"
            placeholder="Password"
            required
          />

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="pixel-button w-full"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 mb-4">or</p>
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="bg-white text-black px-6 py-3 text-xs font-bold"
          >
            Continue with Google
          </button>
        </div>
      </motion.div>
    </div>
  )
}
