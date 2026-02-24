import { create } from 'zustand'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../utils/firebase'

const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY || 
                   import.meta.env.VITE_FIREBASE_API_KEY.startsWith('your_')

export const useAuthStore = create((set, get) => ({
  user: isDemoMode ? { uid: 'demo-user', email: 'demo@educraft.com' } : null,
  userData: isDemoMode ? { 
    name: 'Demo Player', 
    email: 'demo@educraft.com', 
    role: 'student', 
    grade: '5',
    avatar_color: '#4ECDC4'
  } : null,
  loading: false,
  error: null,
  firebaseReady: !isDemoMode,
  isDemoMode,

  initialize: () => {
    if (isDemoMode) return () => {}
    
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userData = await getUserData(user.uid)
            set({ user, userData, loading: false, firebaseReady: true })
          } catch (e) {
            console.error('Error fetching user data:', e)
            set({ user, userData: null, loading: false, firebaseReady: true })
          }
        } else {
          set({ user: null, userData: null, loading: false, firebaseReady: true })
        }
      })
      return () => unsubscribe()
    } catch (error) {
      console.error('Firebase init error:', error)
      set({ loading: false, firebaseReady: true, error: error.message })
      return () => {}
    }
  },

  login: async (email, password) => {
    if (isDemoMode) {
      set({ user: { uid: 'demo-user', email }, userData: { name: 'Demo Player', role: 'student', grade: '5' }})
      return true
    }
    
    try {
      set({ error: null })
      const result = await signInWithEmailAndPassword(auth, email, password)
      const userData = await getUserData(result.user.uid)
      set({ user: result.user, userData })
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  signup: async (email, password, name, role, grade) => {
    if (isDemoMode) {
      set({ 
        user: { uid: 'demo-user', email }, 
        userData: { name, email, role, grade, avatar_color: '#4ECDC4' }
      })
      return true
    }
    
    try {
      set({ error: null })
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const userData = {
        name,
        email,
        role,
        grade: role === 'student' ? grade : null,
        avatar_color: getRandomColor(),
        subjects_played: [],
        created_at: new Date().toISOString()
      }
      
      await setDoc(doc(db, 'users', result.user.uid), userData)
      await setDoc(doc(db, 'achievements', result.user.uid), {
        badges: [],
        current_streak: 0,
        longest_streak: 0,
        last_played_date: null
      })
      
      set({ user: result.user, userData })
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  loginWithGoogle: async () => {
    if (isDemoMode) {
      return { needsSetup: false }
    }
    
    try {
      set({ error: null })
      const result = await signInWithPopup(auth, googleProvider)
      const userData = await getUserData(result.user.uid)
      
      if (!userData) {
        return { needsSetup: true, user: result.user }
      }
      
      set({ user: result.user, userData })
      return { needsSetup: false }
    } catch (error) {
      set({ error: error.message })
      return { needsSetup: false }
    }
  },

  completeSetup: async (name, role, grade) => {
    if (isDemoMode) {
      set({ userData: { name, role, grade, avatar_color: '#4ECDC4' }})
      return true
    }
    
    try {
      const { user } = get()
      if (!user) return false

      const userData = {
        name,
        email: user.email,
        role,
        grade: role === 'student' ? grade : null,
        avatar_color: getRandomColor(),
        subjects_played: [],
        created_at: new Date().toISOString()
      }

      await setDoc(doc(db, 'users', user.uid), userData)
      await setDoc(doc(db, 'achievements', user.uid), {
        badges: [],
        current_streak: 0,
        longest_streak: 0,
        last_played_date: null
      })

      set({ userData })
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  logout: async () => {
    if (isDemoMode) {
      set({ user: null, userData: null })
      return
    }
    
    try {
      await signOut(auth)
      set({ user: null, userData: null })
    } catch (error) {
      set({ error: error.message })
    }
  },

  updateStreak: async () => {}
}))

async function getUserData(uid) {
  if (!db) return null
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists()) {
    return userSnap.data()
  }
  return null
}

function getRandomColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
  return colors[Math.floor(Math.random() * colors.length)]
}
