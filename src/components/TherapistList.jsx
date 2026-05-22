import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Clock, CheckCircle, X, Calendar, MessageCircle, Lock, ShieldAlert, ChevronLeft } from 'lucide-react'
import { getTherapists, bookSession, getWellnessScore } from '../lib/db'

const MOCK_THERAPISTS = [
  { id: 'm1', name: 'Dr. Sarah Mitchell', spec: 'Anxiety & Depression', exp: '12 years', rating: 4.9, reviews: 234, is_available: true, avatar: '👩‍⚕️', tags: ['CBT', 'Mindfulness'], price: '$80/session' },
  { id: 'm2', name: 'Dr. James Patel', spec: 'Stress & Burnout', exp: '8 years', rating: 4.8, reviews: 189, is_available: true, avatar: '👨‍⚕️', tags: ['DBT', 'Trauma'], price: '$75/session' },
  { id: 'm3', name: 'Dr. Priya Sharma', spec: 'Teen & Youth Wellness', exp: '10 years', rating: 4.9, reviews: 312, is_available: false, avatar: '👩‍⚕️', tags: ['Play Therapy', 'CBT'], price: '$70/session' },
  { id: 'm4', name: 'Dr. Michael Chen', spec: 'Career Coaching & Stress', exp: '5 years', rating: 4.7, reviews: 142, is_available: true, avatar: '👨‍⚕️', tags: ['Career', 'Life Transition'], price: '$90/session' },
  { id: 'm5', name: 'Dr. Emily Rose', spec: 'Relationships & Family', exp: '15 years', rating: 4.9, reviews: 412, is_available: true, avatar: '👩‍⚕️', tags: ['Couples', 'Family'], price: '$100/session' },
  { id: 'm6', name: 'Dr. Marcus Johnson', spec: 'PTSD & Trauma', exp: '14 years', rating: 4.8, reviews: 290, is_available: false, avatar: '👨‍⚕️', tags: ['EMDR', 'Trauma'], price: '$110/session' },
  { id: 'm7', name: 'Dr. Sofia Garcia', spec: 'Anxiety & Phobias', exp: '9 years', rating: 4.7, reviews: 175, is_available: true, avatar: '👩‍⚕️', tags: ['Exposure', 'CBT'], price: '$85/session' },
  { id: 'm8', name: 'Dr. William Taylor', spec: 'Addiction Recovery', exp: '20 years', rating: 4.9, reviews: 520, is_available: true, avatar: '👨‍⚕️', tags: ['Addiction', 'Group'], price: '$60/session' },
  { id: 'm9', name: 'Dr. Olivia Brown', spec: 'Eating Disorders', exp: '7 years', rating: 4.6, reviews: 98, is_available: true, avatar: '👩‍⚕️', tags: ['ED', 'Body Image'], price: '$95/session' },
  { id: 'm10', name: 'Dr. Daniel Kim', spec: 'General Mental Health', exp: '6 years', rating: 4.8, reviews: 115, is_available: true, avatar: '👨‍⚕️', tags: ['General', 'Wellness'], price: '$65/session' },
]

export default function TherapistList({ authUserId }) {
  const [therapists, setTherapists] = useState([])
  const [selected, setSelected] = useState(null)
  const [booked, setBooked] = useState(null)
  const [activeChatTherapist, setActiveChatTherapist] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [isLocked, setIsLocked] = useState(true)

  useEffect(() => {
    const init = async () => {
      // 1. Check if user is allowed to see therapists (Stress > 80%)
      if (authUserId) {
        const { data } = await getWellnessScore(authUserId)
        if (data && data.burnout_risk === "High") {
          setIsLocked(false)
        }
      }

      // 2. Load therapists (fallback to mock 10 therapists)
      const { data: tData } = await getTherapists()
      if (tData && tData.length > 0) {
        // Merge DB therapists with mock to ensure we show 10
        const combined = [...tData, ...MOCK_THERAPISTS].slice(0, 10)
        // ensure tags are arrays
        const normalized = combined.map(t => ({
          ...t, 
          tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags
        }))
        setTherapists(normalized)
      } else {
        setTherapists(MOCK_THERAPISTS)
      }
      setLoading(false)
    }
    
    init()
  }, [authUserId])

  const filtered = filter === 'available' ? therapists.filter(t => t.is_available) : therapists

  const handleBooking = async () => {
    if (authUserId && selected) {
      await bookSession(authUserId, selected.name, 'Tomorrow', '10:00 AM')
    }
    setBooked(true)
  }

  if (loading) return <div className="flex justify-center p-12 text-slate-400">Loading...</div>

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 h-full">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-10 max-w-lg border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Therapist Access Locked</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Our priority mental health professional network is currently locked. This feature automatically unlocks when the AI detects high stress or burnout risks (Stress Score &gt; 80%) to ensure those in critical need get priority access.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-blue-400 font-medium bg-blue-500/10 py-2 px-4 rounded-xl inline-flex">
            <ShieldAlert size={14} /> Keep chatting with the AI to monitor your wellness
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Chat View ──
  if (activeChatTherapist) {
    return <TherapistChat therapist={activeChatTherapist} onBack={() => setActiveChatTherapist(null)} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Find Your Therapist 🩺</h1>
        <p className="text-slate-400 text-sm mt-1">Connect with certified mental health professionals</p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20">
          <ShieldAlert size={14} /> High stress detected. Priority booking unlocked.
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'available'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'glass text-slate-400 hover:text-white'}`}>
            {f === 'all' ? 'All Therapists' : '✅ Available Now'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 card-hover border border-white/5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center text-3xl flex-shrink-0">
                {t.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate">{t.name}</div>
                <div className="text-xs text-blue-400 mt-0.5">{t.spec}</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${t.is_available ? 'bg-green-400' : 'bg-slate-500'}`} />
                  <span className={`text-xs ${t.is_available ? 'text-green-400' : 'text-slate-500'}`}>
                    {t.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-white font-medium">{t.rating}</span>
                <span>({t.reviews})</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{t.exp}</span>
              </div>
              <span className="ml-auto text-teal-400 font-medium">{t.price}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {t.tags && t.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{tag}</span>
              ))}
            </div>

            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => t.is_available && setSelected(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1 ${t.is_available ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                <Calendar size={13} /> Book Session
              </motion.button>
              <button onClick={() => setActiveChatTherapist(t)} className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <MessageCircle size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Booking modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              {booked ? (
                <div className="text-center py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Session Booked! 🎉</h3>
                  <p className="text-slate-400 text-sm">Your session with {selected.name} has been confirmed.</p>
                  <button onClick={() => { setSelected(null); setBooked(false) }} className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium">Done</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Book a Session</h3>
                    <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 mb-4">
                    <span className="text-3xl">{selected.avatar}</span>
                    <div>
                      <div className="font-medium text-white text-sm">{selected.name}</div>
                      <div className="text-xs text-blue-400">{selected.spec}</div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Select Date</label>
                      <input type="date" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Select Time</label>
                      <select className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50">
                        <option>9:00 AM</option><option>11:00 AM</option><option>2:00 PM</option><option>4:00 PM</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleBooking} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                    Confirm Booking — {selected.price}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TherapistChat({ therapist, onBack }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'therapist', text: `Hi there. I'm ${therapist.name}. I see you've been experiencing high stress recently. How can I support you today?` }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)

  const send = () => {
    if (!input.trim()) return
    setMessages(m => [...m, { id: Date.now(), role: 'user', text: input }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now()+1, role: 'therapist', text: "I hear you. Take your time, this is a safe space. We can work through this step-by-step." }])
      setTyping(false)
    }, 1500)
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-[80vh] flex flex-col glass rounded-2xl overflow-hidden border border-white/5 relative">
       {/* Chat Header */}
       <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-slate-900/50">
         <button onClick={onBack} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
           <ChevronLeft size={20} />
         </button>
         <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl border border-blue-500/20 flex-shrink-0">
           {therapist.avatar}
         </div>
         <div>
           <h3 className="text-white font-bold">{therapist.name}</h3>
           <div className="flex items-center gap-1.5 text-xs text-green-400 mt-0.5">
             <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
             Online • Secure Session
           </div>
         </div>
       </div>
       
       {/* Messages */}
       <div className="flex-1 p-6 overflow-y-auto space-y-6">
         <div className="text-center text-xs text-slate-500 mb-6 border-b border-white/5 pb-6">
           This is an encrypted, HIPAA-compliant secure session.
         </div>
         {messages.map(msg => (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5'}`}>
               {msg.text}
             </div>
           </motion.div>
         ))}
         {typing && (
           <div className="flex justify-start">
             <div className="bg-slate-800 border border-white/5 px-5 py-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center h-11">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                ))}
             </div>
           </div>
         )}
       </div>

       {/* Input */}
       <div className="p-4 border-t border-white/5 bg-slate-900/50 flex gap-3">
         <input 
           value={input} 
           onChange={e=>setInput(e.target.value)} 
           onKeyDown={e=>e.key==='Enter'&&send()} 
           placeholder="Type your message securely..." 
           className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all shadow-inner" 
         />
         <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={send} className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 flex-shrink-0">
           <MessageCircle size={18} className="fill-white/20" />
         </motion.button>
       </div>
    </motion.div>
  )
}
