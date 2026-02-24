import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AuthScreen from './screens/AuthScreen'
import StudentDashboard from './screens/StudentDashboard'
import TeacherDashboard from './screens/TeacherDashboard'
import ModeSelection from './screens/ModeSelection'
import WorldSelection from './screens/WorldSelection'
import GameWorld from './screens/GameWorld'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const { loading, user, initialize, isDemoMode } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <AuthScreen /> : <Navigate to="/home" replace />} />
      <Route path="/home" element={user ? <StudentDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/teacher" element={user ? <TeacherDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/select" element={user ? <ModeSelection /> : <Navigate to="/login" replace />} />
      <Route path="/world" element={user ? <WorldSelection /> : <Navigate to="/login" replace />} />
      <Route path="/game" element={user ? <GameWorld /> : <Navigate to="/login" replace />} />
      <Route path="/" element={<Navigate to={user ? "/home" : "/login"} replace />} />
    </Routes>
  )
}

export default App
