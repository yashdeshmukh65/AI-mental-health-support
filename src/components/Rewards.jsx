import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { motion } from 'framer-motion'
import { Trophy, Star, Medal, Award, CheckCircle2, Shield, Flame, Download, Lock } from 'lucide-react'
import { getStreaks, getUserProfile } from '../lib/db'

// Progress Levels
const levels = [
  { id: 1, title: 'Beginner', max: 100, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  { id: 2, title: 'Growing Mind', max: 300, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 3, title: 'Wellness Explorer', max: 600, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 4, title: 'Mind Champion', max: 1000, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { id: 5, title: 'Wellness Master', max: Infinity, color: 'text-amber-400', bg: 'bg-amber-500/20' },
]

const getLevelInfo = (xp) => {
  for (let i = 0; i < levels.length; i++) {
    if (xp <= levels[i].max) {
      const currentLevel = levels[i]
      const prevMax = i > 0 ? levels[i - 1].max : 0
      const progress = ((xp - prevMax) / (currentLevel.max - prevMax)) * 100
      return { ...currentLevel, progress: Math.min(100, Math.max(0, progress)), nextMax: currentLevel.max }
    }
  }
  return { ...levels[levels.length - 1], progress: 100, nextMax: Infinity }
}

const allBadges = [
  { id: 'streak_7', title: '7-Day Calm Streak', desc: 'Maintained a 7-day wellness streak', icon: Flame, condition: (s) => s.current_streak >= 7, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { id: 'points_100', title: 'Beginner Steps', desc: 'Earned your first 100 points', icon: Star, condition: (s) => s.total_xp >= 100, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'points_300', title: 'Mindfulness Master', desc: 'Reached 300 wellness points', icon: Shield, condition: (s) => s.total_xp >= 300, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'points_600', title: 'Stress Fighter', desc: 'Reached 600 wellness points', icon: Medal, condition: (s) => s.total_xp >= 600, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { id: 'points_1000', title: 'Wellness Master', desc: 'Achieved the ultimate 1000 points', icon: Trophy, condition: (s) => s.total_xp >= 1000, color: 'text-amber-400', bg: 'bg-amber-500/20' },
]

export default function Rewards({ authUserId }) {
  const [streaks, setStreaks] = useState({ current_streak: 0, total_xp: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!authUserId) return
      const { data } = await getStreaks(authUserId)
      if (data) setStreaks(data)
      setLoading(false)
    }
    fetchStats()
  }, [authUserId])

  if (loading) return <div className="flex justify-center p-12 text-slate-400">Loading Rewards...</div>

  const levelInfo = getLevelInfo(streaks.total_xp)

  const downloadCertificate = async () => {
    let name = "Wellness Champion"
    if (authUserId) {
      const { data } = await getUserProfile(authUserId)
      if (data && data.full_name) name = data.full_name
    }
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    })

    const width = doc.internal.pageSize.getWidth()
    const height = doc.internal.pageSize.getHeight()

    // Background color
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, width, height, "F")

    // Outer Border
    doc.setDrawColor(251, 191, 36)
    doc.setLineWidth(6)
    doc.rect(20, 20, width - 40, height - 40)

    // Inner Border
    doc.setLineWidth(2)
    doc.rect(30, 30, width - 60, height - 60)

    // Title
    doc.setTextColor(251, 191, 36)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(40)
    doc.text("CERTIFICATE OF ACHIEVEMENT", width / 2, 150, { align: "center" })

    // Subtitle
    doc.setTextColor(203, 213, 225)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(24)
    doc.text("This certifies that", width / 2, 220, { align: "center" })

    // Name
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "italic")
    doc.setFontSize(48)
    doc.text(name, width / 2, 300, { align: "center" })

    // Text
    doc.setTextColor(203, 213, 225)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(20)
    doc.text("has successfully reached Level 5 and earned the title of", width / 2, 380, { align: "center" })

    // Title 2
    doc.setTextColor(251, 191, 36)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(36)
    doc.text("WELLNESS MASTER", width / 2, 450, { align: "center" })

    // Footer
    doc.setTextColor(148, 163, 184)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(16)
    doc.text("Awarded by MindWell AI Platform", width / 2, 520, { align: "center" })

    // Seal
    doc.setFillColor(251, 191, 36)
    doc.circle(width / 2, 80, 25, "F")
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(24)
    doc.text("w", width / 2, 88, { align: "center" }) // using a simple character as 'star' symbol might not work in base PDF fonts, so 'w' or just leave blank

    doc.save("MindWell_Certificate.pdf")
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Rewards & Achievements 🏆</h1>
        <p className="text-slate-400">Track your mental wellness journey and unlock badges.</p>
      </div>

      {/* Level Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 ${levelInfo.bg} blur-3xl opacity-30 rounded-full -mr-20 -mt-20`} />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 flex flex-col items-center justify-center flex-shrink-0 shadow-2xl relative">
            <div className={`absolute inset-0 rounded-full border-4 border-transparent border-t-${levelInfo.color.split('-')[1]}-400 rotate-45`} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Level</span>
            <span className={`text-4xl font-black ${levelInfo.color}`}>{levelInfo.id}</span>
          </div>
          
          <div className="flex-1 w-full text-center md:text-left">
            <h2 className={`text-3xl font-bold mb-2 ${levelInfo.color}`}>{levelInfo.title}</h2>
            <p className="text-slate-400 mb-6 flex items-center justify-center md:justify-start gap-2">
              <Star size={18} className="text-amber-400" />
              <span className="font-semibold text-white">{streaks.total_xp}</span> / {levelInfo.nextMax === Infinity ? 'MAX' : levelInfo.nextMax} Wellness Points
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                <span>Progress to Level {Math.min(5, levelInfo.id + 1)}</span>
                <span>{Math.round(levelInfo.progress)}%</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${levelInfo.progress}%` }} 
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r from-blue-500 to-${levelInfo.color.split('-')[1]}-400 rounded-full`} 
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Badges Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Achievement Badges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBadges.map((badge, idx) => {
            const isUnlocked = badge.condition(streaks)
            return (
              <motion.div 
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: idx * 0.1 }}
                className={`glass rounded-2xl p-6 flex items-start gap-4 transition-all ${isUnlocked ? 'border-white/10' : 'opacity-60 grayscale border-transparent'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isUnlocked ? badge.bg : 'bg-slate-800'}`}>
                  {isUnlocked ? <badge.icon size={28} className={badge.color} /> : <Lock size={28} className="text-slate-500" />}
                </div>
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {badge.title}
                    {isUnlocked && <CheckCircle2 size={14} className="text-green-400" />}
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">{badge.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Certificate Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-dark rounded-2xl p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="text-amber-400" /> Wellness Master Certificate
          </h3>
          <p className="text-sm text-slate-400 mt-1">Reach Level 5 (1000 points) to unlock and download your official certificate of mental wellness commitment.</p>
        </div>
        <button 
          onClick={downloadCertificate}
          disabled={levelInfo.id < 5}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all flex-shrink-0 ${levelInfo.id >= 5 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:scale-105' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          <Download size={18} />
          Download Certificate
        </button>
      </motion.div>

    </div>
  )
}
