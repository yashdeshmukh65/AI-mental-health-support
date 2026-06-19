import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Gamepad2, Calendar, UserCheck, Settings, LogOut, Brain, Menu, X, Activity, MessageCircle } from 'lucide-react'
import DashboardHome from '../components/DashboardHome'
import MindGames from '../components/MindGames'
import RoutinePlan from '../components/RoutinePlan'
import TherapistList from '../components/TherapistList'
import SettingsPage from '../components/SettingsPage'
import ChatBot from '../components/ChatBot'
import PlatformImpact from '../components/PlatformImpact'
import Rewards from '../components/Rewards'
import { Trophy } from 'lucide-react'
import ConfirmModal from '../components/ui/ConfirmModal'
import { toast } from '../lib/toast'
import OnboardingTour from '../components/OnboardingTour'

const navItems = [
  { id: 'impact', label: 'Platform Impact', icon: Activity },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'rewards', label: 'Rewards', icon: Trophy },
  { id: 'games', label: 'Mind Games', icon: Gamepad2 },
  { id: 'routine', label: '7-Day Routine', icon: Calendar },
  { id: 'therapist', label: 'Therapist', icon: UserCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'chat', label: 'AI Chat', icon: MessageCircle, mobileOnly: true },
]

export default function UserDashboard({ user, authUserId, onLogout }) {
  const [active, setActive] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const { i18n } = useTranslation()

  useEffect(() => {
    // Check if user has seen the tour
    const tourCompleted = localStorage.getItem('mindwell_tour_completed')
    if (!tourCompleted) {
      setShowTour(true)
    }
  }, [])

  const handleTourComplete = () => {
    localStorage.setItem('mindwell_tour_completed', 'true')
    setShowTour(false)
  }

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value)
    localStorage.setItem('appLanguage', e.target.value)
  }

  const pageMap = {
    impact: <PlatformImpact />,
    dashboard: <DashboardHome user={user} authUserId={authUserId} />,
    rewards: <Rewards authUserId={authUserId} />,
    games: <MindGames />,
    routine: <RoutinePlan authUserId={authUserId} />,
    therapist: <TherapistList authUserId={authUserId} />,
    settings: <SettingsPage user={user} />,
    chat: <div className="h-[calc(100vh-6rem)] xl:hidden"><ChatBot user={user} authUserId={authUserId} /></div>,
  }

  return (
    <div className="h-screen gradient-bg flex overflow-hidden relative">
      
      {/* ── ONBOARDING TOUR OVERLAY ── */}
      <AnimatePresence>
        {showTour && <OnboardingTour onComplete={handleTourComplete} />}
      </AnimatePresence>

      {/* ── DESKTOP SIDEBAR (always visible ≥ lg) ── */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 flex-shrink-0 glass-dark border-r border-white/5">
        <SidebarContent active={active} setActive={setActive} onLogout={onLogout} user={user} />
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 z-50 w-64 h-full flex flex-col glass-dark border-r border-white/5 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
              <SidebarContent
                active={active}
                setActive={(id) => { setActive(id); setMobileOpen(false) }}
                onLogout={onLogout}
                user={user}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 glass-dark border-b border-white/5 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="MindWell Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold gradient-text">MindWell</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="bg-transparent text-white text-xs border border-white/10 rounded px-1 py-1 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
              <option value="ta">தமிழ்</option>
            </select>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </div>

        {/* Content + Chatbot row */}
        <div className="flex flex-1 overflow-hidden">

          {/* Page area */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                {pageMap[active]}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* AI Chatbot — visible on xl+, fixed height, no scroll */}
          <div className="hidden xl:flex flex-col w-80 flex-shrink-0 border-l border-white/5 h-full overflow-hidden">
            <ChatBot user={user} authUserId={authUserId} />
          </div>

        </div>
      </div>
    </div>
  )
}

function SidebarContent({ active, setActive, onLogout, user }) {
  const { t, i18n } = useTranslation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand */}
      <div className="p-5 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-white/10 shadow-lg shadow-blue-500/10">
            <img src="/logo.png" alt="MindWell Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-white leading-tight">MindWell</div>
          </div>
        </div>
      </div>

      {/* User card & Language */}
      <div className="mx-3 mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{user?.name || 'User'}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={i18n.language}
            onChange={(e) => {
              const newLang = e.target.value
              i18n.changeLanguage(newLang)
              localStorage.setItem('appLanguage', newLang)
              toast.success(`Language changed to ${e.target.options[e.target.selectedIndex].text}`)
            }}
            className="flex-1 bg-slate-800 text-slate-300 text-xs border border-white/5 rounded px-2 py-1.5 outline-none focus:border-blue-500/50"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
        {navItems.map(({ id, icon: Icon, mobileOnly }) => {
          // Hide mobile-only items on large screens
          if (mobileOnly && window.innerWidth >= 1280) return null;
          
          return (
            <motion.button
              key={id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActive(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active === id
                  ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} className={active === id ? 'text-blue-400' : 'text-slate-500'} />
              <span>{t(`nav.${id}`) || id.charAt(0).toUpperCase() + id.slice(1)}</span>
              {active === id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-white/5 flex-shrink-0">
        <motion.button
          whileHover={{ x: 4 }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          {t('nav.logout')}
        </motion.button>
      </div>

      <ConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={onLogout}
        title="Ready to leave?"
        message="You are about to securely log out of your session. Come back soon!"
        confirmText="Log Out"
      />
    </div>
  )
}
