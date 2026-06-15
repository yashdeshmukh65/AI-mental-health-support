import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Gamepad2, Calendar, UserCheck, Settings, LogOut, Brain, Menu, X, Activity } from 'lucide-react'
import DashboardHome from '../components/DashboardHome'
import MindGames from '../components/MindGames'
import RoutinePlan from '../components/RoutinePlan'
import TherapistList from '../components/TherapistList'
import SettingsPage from '../components/SettingsPage'
import ChatBot from '../components/ChatBot'
import PlatformImpact from '../components/PlatformImpact'
import Rewards from '../components/Rewards'
import { Trophy } from 'lucide-react'

const navItems = [
  { id: 'impact', label: 'Platform Impact', icon: Activity },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'rewards', label: 'Rewards', icon: Trophy },
  { id: 'games', label: 'Mind Games', icon: Gamepad2 },
  { id: 'routine', label: '7-Day Routine', icon: Calendar },
  { id: 'therapist', label: 'Therapist', icon: UserCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function UserDashboard({ user, authUserId, onLogout }) {
  const [active, setActive] = useState('impact')
  const [mobileOpen, setMobileOpen] = useState(false)

  const pageMap = {
    impact: <PlatformImpact />,
    dashboard: <DashboardHome user={user} authUserId={authUserId} />,
    rewards: <Rewards authUserId={authUserId} />,
    games: <MindGames />,
    routine: <RoutinePlan authUserId={authUserId} />,
    therapist: <TherapistList authUserId={authUserId} />,
    settings: <SettingsPage user={user} />,
  }

  return (
    <div className="h-screen gradient-bg flex overflow-hidden">

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
            <Brain size={18} className="text-blue-400" />
            <span className="font-bold gradient-text">MindWell</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0] || 'U'}
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
  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white leading-tight">MindWell</div>
            <div className="text-xs text-slate-400">Wellness Platform</div>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="mx-3 mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name || 'User'}</div>
            <div className="text-xs text-slate-400 capitalize">{user?.category || 'adult'} · Active</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
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
            <span>{label}</span>
            {active === id && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-white/5 flex-shrink-0">
        <motion.button
          whileHover={{ x: 4 }}
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </motion.button>
      </div>

    </div>
  )
}
