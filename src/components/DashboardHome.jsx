import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, AlertTriangle, Heart, Activity, Target, Flame, Star, Bell, Brain, Trophy, Gamepad2 } from 'lucide-react'
import { getWellnessScore, subscribeToWellnessScore, getAnomalyAlerts, subscribeToAnomalyAlerts, getStreaks } from '../lib/db'

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

export default function DashboardHome({ user }) {
  const [scoreData, setScoreData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [streakData, setStreakData] = useState({ current_streak: 0, total_xp: 0 })

  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial data
    getWellnessScore(user.id).then(({ data }) => data && setScoreData(data))
    getStreaks(user.id).then(({ data }) => data && setStreakData(data))
    getAnomalyAlerts(user.id).then(({ data }) => data && setAlerts(data))

    // Real-time Subscriptions
    const subScore = subscribeToWellnessScore(user.id, (payload) => setScoreData(payload.new))
    const subAlerts = subscribeToAnomalyAlerts(user.id, (payload) => setAlerts(prev => [payload.new, ...prev]))

    return () => {
      if (subScore) subScore.unsubscribe()
      if (subAlerts) subAlerts.unsubscribe()
    }
  }, [user?.id])

  // Real-time metrics
  const overall = scoreData?.overall_score ?? 80
  const burnout = scoreData?.burnout_risk ?? 'Low'
  const stability = scoreData?.emotional_stability ?? 85
  const recovery = scoreData?.recovery_progress ?? 50

  const statCards = [
    { label: 'Live Mood Score', value: overall, unit: '/100', icon: Heart, color: 'from-pink-500 to-rose-500', bg: 'from-pink-500/10 to-rose-500/10', border: 'border-pink-500/20' },
    { label: 'Live Stress Level', value: (100 - stability), unit: '/100', icon: Zap, color: 'from-amber-500 to-orange-500', bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20' },
    { label: 'Burnout Risk', value: burnout, unit: '', icon: AlertTriangle, color: 'from-teal-500 to-green-500', bg: 'from-teal-500/10 to-green-500/10', border: 'border-teal-500/20' },
    { label: 'Emotional Stability', value: stability, unit: '/100', icon: Activity, color: 'from-blue-500 to-purple-500', bg: 'from-blue-500/10 to-purple-500/10', border: 'border-blue-500/20' },
  ]

  const wellnessCards = [
    { label: 'Current Wellness Score', value: overall, icon: Star, color: '#60a5fa' },
    { label: 'Therapy Goal Progress', value: recovery, icon: TrendingUp, color: '#34d399' },
  ]

  const levelInfo = getLevelInfo(streakData.total_xp || 0)
  const behavioralInsight = streakData.current_streak > 3 ? "Consistent Engagement" : streakData.total_xp > 100 ? "Focus Improving" : "Needs More Practice"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Good morning, {user?.name?.split(' ')[0] || 'there'} 🌅</h1>
          <p className="text-slate-400 text-sm mt-1">Here is your live, real-time AI sentiment analysis</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-sm font-medium">Real-time Analysis Active</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3">
          <Bell className="text-red-400 shrink-0 mt-0.5" size={20} />
          <div>
            <div className="text-sm font-bold text-red-400">Critical Alert Detected</div>
            <div className="text-xs text-red-300 mt-1">{alerts[0].alert_reason || "The AI detected an alarming pattern in your sentiment. Please consider taking a break."}</div>
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`glass rounded-2xl p-5 card-hover bg-gradient-to-br ${card.bg} border ${card.border}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{card.value}<span className="text-sm text-slate-400">{card.unit}</span></div>
            <div className="text-xs text-slate-400 mt-1">{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Sentiment Insight Card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
          
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Brain className="text-purple-400" size={20} />
            <h3 className="font-semibold text-white">Live AI Sentiment Insight</h3>
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-xs text-slate-400 mb-3">Current real-time AI understanding of your state:</div>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{stability > 70 ? '😊' : stability > 40 ? '😐' : '😰'}</span>
                <div>
                  <div className="text-xl font-bold text-white">
                    {stability > 70 ? 'Positive & Calm' : stability > 40 ? 'Neutral State' : 'High Stress Detected'}
                  </div>
                  <div className="text-sm text-blue-400 mt-1">
                    Powered by DistilBERT NLP
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
              {stability > 70 
                ? "The AI is actively analyzing your chats and daily reflections. Right now, your emotional state is highly positive! Your database metrics reflect a strong recovery trend."
                : stability > 40
                ? "Your recent interactions show a balanced, neutral emotional state. The database is tracking your mood in real-time as you interact with the bot."
                : "The AI has detected signs of stress and anxiety in your live interactions. Your risk levels have automatically updated in the database, and your routine has been adjusted to help you recover."}
            </p>
          </div>
        </motion.div>

        {/* Live Progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 space-y-6 flex flex-col justify-center">
          <div>
            <h3 className="font-semibold text-white mb-1">Live AI Calculations</h3>
            <p className="text-xs text-slate-400 mb-6">These bars update instantly in the database when you chat or complete tasks.</p>
          </div>

          <div className="space-y-5">
            {wellnessCards.map((card, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <card.icon size={16} style={{ color: card.color }} />
                    <span className="text-sm font-medium text-slate-200">{card.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{Math.round(card.value)}%</span>
                </div>
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden border border-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${card.value}%` }} transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                    className="h-full rounded-full" style={{ background: card.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Current emotional state */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs text-slate-400">Database Sync Status</div>
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </div>
            </div>
            <div className="text-sm font-medium text-white">Continuous Sentiment Monitoring</div>
            <div className="text-xs text-slate-400 mt-1">Every message sent to the AI updates your burnout risk in real-time.</div>
          </div>
        </motion.div>

        {/* Gamification & Behavioral Insights */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6 lg:col-span-2 flex flex-col md:flex-row gap-6">
          {/* Level Progress */}
          <div className="flex-1 flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${levelInfo.bg}`}>
              <Trophy size={32} className={levelInfo.color} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                Level {levelInfo.id}: {levelInfo.title}
              </h3>
              <p className="text-slate-400 text-sm mb-3">
                <span className="font-bold text-amber-400">{streakData.total_xp || 0}</span> / {levelInfo.nextMax === Infinity ? 'MAX' : levelInfo.nextMax} XP
              </p>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${levelInfo.progress}%` }} 
                  className={`h-full bg-gradient-to-r from-blue-500 to-${levelInfo.color.split('-')[1]}-400 rounded-full`} 
                />
              </div>
            </div>
          </div>

          {/* Activity Streak & Game Insight */}
          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <Flame size={20} className="text-orange-400" />
              <div>
                <div className="text-sm font-bold text-white">{streakData.current_streak || 0} Day Streak</div>
                <div className="text-xs text-slate-400">Keep it up!</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <Gamepad2 size={20} className="text-purple-400" />
              <div>
                <div className="text-xs text-slate-400">Game Behavior Insight</div>
                <div className="text-sm font-bold text-purple-300">{behavioralInsight}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
