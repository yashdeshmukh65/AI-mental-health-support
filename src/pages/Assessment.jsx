import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ChevronRight, Sparkles, AlertCircle } from 'lucide-react'
import { submitAssessmentApi } from '../lib/api'

const minorQuestions = [
  { id: 1, text: "How often do you feel stressed because of studies, exams, or school pressure?", type: 'emoji', options: ['😌 Rarely', '😐 Sometimes', '😟 Often', '😰 Always'] },
  { id: 2, text: "Do you feel lonely, ignored, or emotionally disconnected from friends or family?", type: 'emoji', options: ['💚 Never', '💛 Occasionally', '🧡 Frequently', '❤️ Always'] },
  { id: 3, text: "How would you describe your sleep quality in the last few days?", type: 'card', options: ['😴 Excellent', '🌙 Good', '😵 Disturbed', '🥱 Very Poor'] },
  { id: 4, text: "Do social media or comparison with others affect your confidence or mood?", type: 'emoji', options: ['🙅 Not at all', '🤔 A little', '😔 Quite a bit', '💔 A lot'] },
  { id: 5, text: "How often do you feel anxious, overthink, or feel emotionally overwhelmed?", type: 'slider' },
]

const adultQuestions = [
  { id: 1, text: "How often do you feel mentally exhausted because of work, studies, or responsibilities?", type: 'emoji', options: ['😊 Rarely', '😐 Sometimes', '😩 Often', '🤯 Always'] },
  { id: 2, text: "Do you struggle to maintain work-life balance or personal time?", type: 'card', options: ['✅ Great balance', '⚖️ Manageable', '😓 Struggling', '🚨 No balance'] },
  { id: 3, text: "How would you rate your stress level during the past week?", type: 'slider' },
  { id: 4, text: "Do you often feel emotionally drained, unmotivated, or burned out?", type: 'emoji', options: ['💪 Never', '🌤️ Rarely', '🌧️ Often', '⛈️ Always'] },
  { id: 5, text: "How frequently do anxiety, overthinking, or pressure affect your daily life?", type: 'emoji', options: ['🟢 Never', '🟡 Sometimes', '🟠 Frequently', '🔴 Daily'] },
]

export default function Assessment({ user, authUserId, onComplete }) {
  const questions = user.category === 'minor' ? minorQuestions : adultQuestions
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [sliderVal, setSliderVal] = useState(5)
  const [analyzing, setAnalyzing] = useState(false)
  const [saveError, setSaveError] = useState('')

  const q = questions[current]
  const isLast = current === questions.length - 1

  const answer = (val) => setAnswers(a => ({ ...a, [q.id]: val }))

  const next = async () => {
    const val = q.type === 'slider' ? sliderVal : answers[q.id]
    if (!val && q.type !== 'slider') return
    const updatedAnswers = { ...answers, [q.id]: val }
    setAnswers(updatedAnswers)

    if (isLast) {
      setAnalyzing(true)
      setSaveError('')

      // Save assessment via FastAPI backend
      try {
        await submitAssessmentApi(user.category, updatedAnswers)
      } catch (error) {
        console.error('Assessment save error:', error)
        setSaveError(error.message)
        // Still proceed to dashboard even if save fails
      }

      setTimeout(() => onComplete(), 2500)
    } else {
      setCurrent(c => c + 1)
      setSliderVal(5)
    }
  }

  if (analyzing) return <AnalyzingScreen />

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-lg relative z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain size={20} className="text-blue-400" />
            <span className="text-lg font-bold gradient-text">Wellness Assessment</span>
          </div>
          <p className="text-slate-400 text-sm">Hi {user.name.split(' ')[0]} 👋 — Let's understand your emotional state</p>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Question {current + 1} of {questions.length}</span>
            <span>{Math.round((current / questions.length) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              animate={{ width: `${(current / questions.length) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        {saveError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} /> {saveError}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }} className="glass rounded-2xl p-8 shadow-2xl">
            <div className="mb-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                {user.category === 'minor' ? '🎓 Student Assessment' : '💼 Adult Assessment'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-4 mb-6 leading-relaxed">{q.text}</h3>

            {q.type === 'slider' && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>😌 Very Low</span>
                  <span className="text-2xl font-bold gradient-text">{sliderVal}</span>
                  <span>😰 Very High</span>
                </div>
                <input type="range" min="1" max="10" value={sliderVal}
                  onChange={e => setSliderVal(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
                  style={{ background: `linear-gradient(to right, #3b82f6 ${(sliderVal - 1) * 11.1}%, #334155 ${(sliderVal - 1) * 11.1}%)` }} />
                <div className="flex justify-between text-xs text-slate-500">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>
            )}

            {(q.type === 'emoji' || q.type === 'card') && (
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => answer(opt)}
                    className={`p-4 rounded-xl text-sm font-medium transition-all text-left ${answers[q.id] === opt ? 'bg-gradient-to-br from-blue-600/40 to-purple-600/40 border border-blue-500/50 text-white' : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-blue-500/30'}`}>
                    {opt}
                  </motion.button>
                ))}
              </div>
            )}

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={next}
              disabled={q.type !== 'slider' && !answers[q.id]}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20">
              {isLast ? <><Sparkles size={16} /> Complete Assessment</> : <>Next <ChevronRight size={16} /></>}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function AnalyzingScreen() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-purple-500" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-teal-400 border-l-blue-400" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain size={28} className="text-blue-400" />
          </div>
        </div>
        <motion.h2 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl font-bold gradient-text mb-3">
          Analyzing Emotional Wellness...
        </motion.h2>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Saving your responses and building your wellness profile
        </p>
        {/* BERT sentiment analysis will be integrated here later */}
        <p className="text-slate-600 text-xs mt-4">🤖 AI model processing responses...</p>
      </motion.div>
    </div>
  )
}
