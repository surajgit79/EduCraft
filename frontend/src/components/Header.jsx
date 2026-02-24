import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Header() {
  const navigate = useNavigate()
  const { user, userData, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-transparent z-50 px-4 py-3">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <button 
          onClick={() => navigate('/home')}
          className="text-[#4CAF50] text-xl font-bold text-shadow hover:text-[#45a049]"
        >
          EduCraft
        </button>
        
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-xs text-gray-300 bg-black/30 px-3 py-1 rounded">
              {userData?.name || user?.displayName || 'Player'}
              {userData?.grade && ` | Grade ${userData.grade}`}
            </span>
          )}
          <button 
            onClick={handleLogout}
            className="text-xs text-gray-300 hover:text-white bg-black/30 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
