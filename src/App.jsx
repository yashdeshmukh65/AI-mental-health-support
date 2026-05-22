import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { signOut } from './lib/db'
import Registration from './pages/Registration'
import Assessment from './pages/Assessment'
import UserDashboard from './pages/UserDashboard'
import './index.css'

export default function App() {
  const { authUser, profile, loading, refetchProfile } = useAuth()
  // 'assessment' view is shown after fresh signup before profile has category confirmed
  const [showAssessment, setShowAssessment] = useState(false)
  const [freshUser, setFreshUser] = useState(null) // holds form data during assessment
  const [isRegistering, setIsRegistering] = useState(false)

  const handleLogout = async () => {
    await signOut()
    setShowAssessment(false)
    setFreshUser(null)
    setIsRegistering(false)
  }

  const handleRegistered = (userData) => {
    // userData comes from Registration after Supabase signup + profile upsert
    setFreshUser(userData)
    setShowAssessment(true)
    setIsRegistering(false)
  }

  const handleAssessmentDone = () => {
    setShowAssessment(false)
    refetchProfile()
  }

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (loading && !isRegistering) return <LoadingScreen />

  // ── Not logged in or currently in the middle of registration ───────────────
  if (!authUser || isRegistering) {
    return <Registration 
      onRegistered={handleRegistered} 
      setIsRegistering={setIsRegistering}
      onTherapistLogin={() => alert('Therapist Dashboard coming soon!')} 
    />
  }

  // ── Logged in but needs assessment (fresh signup) ───────────────────────────
  if (showAssessment && freshUser) {
    return (
      <Assessment
        user={freshUser}
        authUserId={authUser.id}
        onComplete={handleAssessmentDone}
      />
    )
  }

  // ── Returning user — profile exists, go straight to dashboard ──────────────
  const dashboardUser = profile
    ? {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        guardianPhone: profile.guardian_number,
        dob: profile.dob,
        category: profile.category,
      }
    : freshUser

  // If they are logged in but we have no profile AND no freshUser, 
  // it means the background profile creation is still running. Wait for it!
  if (authUser && !dashboardUser) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
        <LoadingScreen />
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm mb-4">Taking too long? Your profile might have failed to save.</p>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm">
            Log Out & Try Again
          </button>
        </div>
      </div>
    )
  }

  return <UserDashboard user={dashboardUser} authUserId={authUser.id} onLogout={handleLogout} />
}

function LoadingScreen({ onClearData }) {
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-purple-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain size={24} className="text-blue-400" />
          </div>
        </div>
        <p className="text-slate-400 text-sm">Loading MindWell...</p>
      </motion.div>

      {showFallback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center px-4">
          <p className="text-red-400 text-sm mb-3">Stuck here? Your session data might be corrupted.</p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} 
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-semibold"
          >
            Clear Data & Refresh
          </button>
        </motion.div>
      )}
    </div>
  )
}
