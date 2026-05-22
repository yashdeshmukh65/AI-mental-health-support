import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle2, Circle, Flame, Trophy, Droplets, Music, Moon, BookOpen, Sun, Wind, Apple, Lock, ShieldAlert, HeartHandshake } from 'lucide-react'
import { saveTaskProgress, getWellnessProgress, getMoodLogs, getStreaks, getWellnessScore } from '../lib/db'
import { getRoutineApi, submitDailyFeedbackApi } from '../lib/api'

const days = [
  { day: 1, theme: 'Fresh Start', emoji: '🌅', color: 'from-blue-500 to-cyan-500' },
  { day: 2, theme: 'Inner Peace', emoji: '🧘', color: 'from-purple-500 to-pink-500' },
  { day: 3, theme: 'Energy Boost', emoji: '⚡', color: 'from-amber-500 to-orange-500' },
  { day: 4, theme: 'Mindful Focus', emoji: '🎯', color: 'from-teal-500 to-green-500' },
  { day: 5, theme: 'Self Care', emoji: '💆', color: 'from-rose-500 to-pink-500' },
  { day: 6, theme: 'Social Wellness', emoji: '🤝', color: 'from-indigo-500 to-blue-500' },
  { day: 7, theme: 'Reflection', emoji: '🌟', color: 'from-violet-500 to-purple-500' },
]

const buildTasks = (day) => {
  return {
    morning: [
      { id: `${day}-m1`, icon: Apple, label: 'Therapeutic Breakfast', desc: 'Mindful eating, no screens', xp: 15 },
      { id: `${day}-m2`, icon: Sun, label: 'Guided Meditation (15m)', desc: 'Focus on deep healing and breath', xp: 20 },
    ],
    afternoon: [
      { id: `${day}-a1`, icon: Wind, label: '4-7-8 Breathing Exercise', desc: 'Calm the nervous system (5 mins)', xp: 15 },
      { id: `${day}-a2`, icon: Sun, label: 'Digital Detox', desc: 'Step away from screens completely', xp: 15 },
    ],
    evening: [
      { id: `${day}-e1`, icon: Music, label: 'Somatic Stretching', desc: 'Release physical tension', xp: 15 },
      { id: `${day}-e2`, icon: Wind, label: 'Nature Walk', desc: 'Walk outside, focus on surroundings', xp: 15 },
    ],
    night: [
      { id: `${day}-n1`, icon: BookOpen, label: 'Gratitude Journaling', desc: 'Write 3 positive things from today', xp: 20 },
      { id: `${day}-n2`, icon: Moon, label: 'Deep Sleep Meditation', desc: 'Listen to calming sounds (15 mins)', xp: 15 },
    ],
  }
}

const sectionColors = {
  morning:   { label: '🌅 Morning',   color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  afternoon: { label: '☀️ Afternoon', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  evening:   { label: '🌆 Evening',   color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  night:     { label: '🌙 Night',     color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
}

export default function RoutinePlan({ authUserId }) {
  const [expanded, setExpanded] = useState(1)
  const [completed, setCompleted] = useState({})
  
  // 4 Questions per day instead of 1 note
  const [q1, setQ1] = useState({})
  const [q2, setQ2] = useState({})
  const [q3, setQ3] = useState({})
  const [q4, setQ4] = useState({})
  const [feedbackSubmitted, setFeedbackSubmitted] = useState({})

  const [savingTask, setSavingTask] = useState(null)
  const [savingMood, setSavingMood] = useState(null)
  const [streaks, setStreaks] = useState({ current_streak: 0, total_xp: 0 })
  
  // Lock logic
  const [stressLevel, setStressLevel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authUserId) return

    const init = async () => {
      // 1. Get Wellness Score for locks
      const { data: sData } = await getWellnessScore(authUserId)
      if (sData) {
        const stress = 100 - (sData.emotional_stability ?? 85)
        setStressLevel(stress)
      } else {
        setStressLevel(15) // default
      }

      // 2. Load Progress
      const { data: pData } = await getWellnessProgress(authUserId)
      if (pData) {
        const c = {}
        pData.forEach(p => { c[p.task_id] = p.completed })
        setCompleted(c)
      }

      // 3. Load Moods
      const { data: mData } = await getMoodLogs(authUserId)
      if (mData) {
        const submitted = {}
        mData.forEach(d => { submitted[d.day] = true }) // Note acts as a marker
        setFeedbackSubmitted(submitted)
      }

      // 4. Load Streaks
      fetchStreaks()
      setLoading(false)
    }

    init()
  }, [authUserId])

  const fetchStreaks = async () => {
    if (!authUserId) return
    const { data } = await getStreaks(authUserId)
    if (data) setStreaks(data)
  }

  const toggleTask = async (taskId) => {
    const newVal = !completed[taskId]
    setCompleted(c => ({ ...c, [taskId]: newVal }))
    setSavingTask(taskId)
    // Find XP reward
    let xp = 15
    days.forEach(d => {
      Object.values(buildTasks(d.day)).flat().forEach(t => { if (t.id === taskId) xp = t.xp })
    })
    
    if (authUserId) {
      await saveTaskProgress(authUserId, taskId, newVal, xp)
      await fetchStreaks() // refresh XP
    }
    setSavingTask(null)
  }

  const saveDailyFeedback = async (day) => {
    const a1 = q1[day] || ''
    const a2 = q2[day] || ''
    const a3 = q3[day] || ''
    const a4 = q4[day] || ''

    if (!a1 || !a2 || !a3 || !a4) {
      alert("Please answer all 4 questions before submitting!")
      return
    }

    const combinedNote = `Mood: ${a1}. Stressors: ${a2}. Symptoms: ${a3}. Gratitude: ${a4}.`
    setSavingMood(day)
    
    try {
      const response = await submitDailyFeedbackApi(combinedNote, day)
      setFeedbackSubmitted(prev => ({ ...prev, [day]: true }))
      if (response.therapist_unlocked) {
        alert("🚨 Your emotional feedback indicates high stress. Therapist support has been unlocked in your dashboard.")
      }
    } catch (error) {
      console.error("Daily Feedback Error:", error)
    }

    setSavingMood(null)
  }

  const getDayProgress = (day) => {
    const all = Object.values(buildTasks(day)).flat()
    const done = all.filter(t => completed[t.id]).length
    return { done, total: all.length, pct: Math.round((done / all.length) * 100) }
  }

  const isDayCompleted = (day) => {
    const p = getDayProgress(day)
    return p.done === p.total && feedbackSubmitted[day]
  }

  const isDayUnlocked = (day) => {
    if (day === 1) return true
    return isDayCompleted(day - 1)
  }

  const totalTasks = days.length * Object.values(buildTasks(1)).flat().length

  if (loading) return <div className="flex justify-center p-12 text-slate-400">Loading...</div>

  // Accessibility Logic
  if (stressLevel < 50) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 h-full">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-10 max-w-lg border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">You're doing great! 🌱</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your AI-calculated stress level is currently very low ({stressLevel}%). You are in a healthy mental state! The structured routine plan is not needed right now. Keep up the amazing work!
          </p>
        </motion.div>
      </div>
    )
  }

  if (stressLevel >= 80) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 h-full">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-10 max-w-lg border border-red-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Critical Stress Level</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your stress level is currently critical ({stressLevel}%). A self-guided routine is disabled during this state. Please prioritize reaching out to a professional immediately.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold bg-red-500 text-white py-3 px-6 rounded-xl hover:bg-red-600 cursor-pointer">
            <HeartHandshake size={18} /> Please use the Therapist Tab
          </div>
        </motion.div>
      </div>
    )
  }

  // Active state: Stress 50-80
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">7-Day Recovery Routine 📅</h1>
          <p className="text-slate-400 text-sm mt-1">
            Intensive Plan for Moderate to High Stress
          </p>
        </div>
        <div className="flex gap-3">
          <div className="glass rounded-xl px-4 py-2 text-center">
            <div className="flex items-center gap-1 text-amber-400 font-bold text-sm"><Flame size={14} /> {streaks.current_streak}</div>
            <div className="text-xs text-slate-400">Day Streak</div>
          </div>
          <div className="glass rounded-xl px-4 py-2 text-center">
            <div className="flex items-center gap-1 text-purple-400 font-bold text-sm"><Trophy size={14} /> {streaks.total_xp}</div>
            <div className="text-xs text-slate-400">Total XP</div>
          </div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Weekly Completion</span>
          <span className="text-sm text-slate-400">
            {days.reduce((acc, d) => acc + getDayProgress(d.day).done, 0)} / {totalTasks} tasks
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 rounded-full"
            animate={{ width: `${Math.round((days.reduce((acc, d) => acc + getDayProgress(d.day).done, 0) / totalTasks) * 100)}%` }}
            transition={{ duration: 1 }} />
        </div>
      </div>

      {/* Day accordion cards */}
      <div className="space-y-3">
        {days.map((d) => {
          const unlocked = isDayUnlocked(d.day)
          const { done, total, pct } = getDayProgress(d.day)
          const tasks = buildTasks(d.day)
          const isOpen = expanded === d.day && unlocked
          const fullyDone = isDayCompleted(d.day)

          return (
            <motion.div key={d.day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d.day * 0.04 }} className={`glass rounded-2xl overflow-hidden ${unlocked ? '' : 'opacity-50 grayscale'}`}>

              {/* Accordion header */}
              <button onClick={() => unlocked && setExpanded(isOpen ? null : d.day)}
                className={`w-full p-5 flex items-center gap-4 transition-colors ${unlocked ? 'hover:bg-white/5 cursor-pointer' : 'cursor-not-allowed'}`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${unlocked ? d.color : 'from-slate-700 to-slate-800'} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {unlocked ? d.emoji : <Lock size={20} className="text-slate-500" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">Day {d.day}</span>
                    <span className="text-xs text-slate-400">— {d.theme}</span>
                    {fullyDone && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">✓ Complete</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${d.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{done}/{total} Tasks</span>
                  </div>
                </div>
                {unlocked && (
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} className="text-slate-400" />
                  </motion.div>
                )}
              </button>

              {/* Accordion body */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                      {Object.entries(tasks).map(([section, items]) => {
                        const sc = sectionColors[section]
                        return (
                          <div key={section}>
                            <div className={`text-xs font-semibold ${sc.color} mb-2`}>{sc.label}</div>
                            <div className={`rounded-xl ${sc.bg} border ${sc.border} p-3 space-y-2`}>
                              {items.map(task => (
                                <div key={task.id} className="flex items-center gap-3">
                                  <button onClick={() => toggleTask(task.id)} className="flex-shrink-0" disabled={savingTask === task.id}>
                                    {savingTask === task.id
                                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                                          className="w-[18px] h-[18px] rounded-full border-2 border-blue-400 border-t-transparent" />
                                      : completed[task.id]
                                        ? <CheckCircle2 size={18} className="text-green-400" />
                                        : <Circle size={18} className="text-slate-500 hover:text-slate-300 transition-colors" />}
                                  </button>
                                  <task.icon size={14} className="text-slate-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium ${completed[task.id] ? 'line-through text-slate-500' : 'text-white'}`}>{task.label}</div>
                                    <div className="text-xs text-slate-500 truncate">{task.desc}</div>
                                  </div>
                                  <span className="text-xs text-purple-400 font-medium flex-shrink-0">+{task.xp}XP</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}

                      {/* Daily 4-Question Feedback */}
                      {pct === 100 && (
                        <div className="mt-6 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            🧠 End of Day Reflection
                            {feedbackSubmitted[d.day] && <span className="text-green-400 text-xs bg-green-500/20 px-2 py-0.5 rounded border border-green-500/30">✓ Submitted</span>}
                          </h4>
                          
                          {!feedbackSubmitted[d.day] ? (
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">1. How would you rate your overall mood today?</label>
                                <input value={q1[d.day] || ''} onChange={e => setQ1(p => ({...p, [d.day]: e.target.value}))} placeholder="E.g., I felt mostly anxious but calm in the evening..." className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">2. What caused you the most stress today?</label>
                                <input value={q2[d.day] || ''} onChange={e => setQ2(p => ({...p, [d.day]: e.target.value}))} placeholder="E.g., An upcoming deadline at work..." className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">3. Did you experience any physical symptoms? (headaches, tension)</label>
                                <input value={q3[d.day] || ''} onChange={e => setQ3(p => ({...p, [d.day]: e.target.value}))} placeholder="E.g., My shoulders were very tight..." className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">4. What is one thing you are grateful for today?</label>
                                <input value={q4[d.day] || ''} onChange={e => setQ4(p => ({...p, [d.day]: e.target.value}))} placeholder="E.g., I enjoyed my morning tea..." className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                              </div>
                              <button onClick={() => saveDailyFeedback(d.day)} disabled={savingMood === d.day} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                                {savingMood === d.day ? 'Analyzing & Saving...' : 'Submit Reflection to AI'}
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                              Your reflection has been securely analyzed by the AI and saved to your wellness timeline.
                            </div>
                          )}
                        </div>
                      )}
                      {pct < 100 && (
                        <div className="mt-2 text-xs text-slate-500 italic text-center">
                          Complete all tasks above to unlock the end-of-day AI reflection.
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
