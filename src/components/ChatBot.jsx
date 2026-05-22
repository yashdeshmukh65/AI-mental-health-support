import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, Sparkles } from 'lucide-react'
import { subscribeToChats, saveChatMessage, getChatHistory } from '../lib/db'
import { sendChatMessageApi } from '../lib/api'

const welcomeMessages = [
  { id: 'w1', role: 'ai', text: "Hi! I'm your MindWell AI companion 🌟 How are you feeling today?" },
  { id: 'w2', role: 'ai', text: "I'm here to listen, support, and guide you through your wellness journey. Feel free to share anything on your mind." },
]

const aiResponses = [
  "That's completely understandable. Remember, it's okay to feel this way. 💙",
  "I hear you. Let's take a deep breath together. Inhale for 4 counts, hold for 4, exhale for 6. 🌬️",
  "You're doing great by reaching out. Self-awareness is the first step to wellness. ✨",
  "Have you tried the breathing exercises in Mind Games? They can really help with that. 🧘",
  "Remember, every small step counts. You're making progress every day! 🌱",
  "It sounds like you need some rest. Your 7-day routine has a great sleep meditation for tonight. 🌙",
]

export default function ChatBot({ user, authUserId }) {
  const [messages, setMessages] = useState(welcomeMessages)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef(null)

  // Load chat history from Supabase on mount and subscribe to realtime
  useEffect(() => {
    if (!authUserId || historyLoaded) return
    getChatHistory(authUserId).then(({ data }) => {
      if (data && data.length > 0) {
        const loaded = data.map(m => ({ id: m.id, role: m.role, text: m.message }))
        setMessages(loaded)
      }
      setHistoryLoaded(true)
    })
    
    const sub = subscribeToChats(authUserId, (payload) => {
      const newMsg = payload.new
      // Avoid duplicating optimistically added messages by checking if text is identical 
      // (in a real app we'd use a UUID generated on the client)
      setMessages(m => {
        if (m.some(existing => existing.text === newMsg.message)) return m;
        return [...m, { id: newMsg.id, role: newMsg.role, text: newMsg.message }]
      })
    })

    return () => { if (sub) sub.unsubscribe() }
  }, [authUserId, historyLoaded])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = async () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')

    // Optimistic UI — add user message immediately
    const tempId = Date.now()
    setMessages(m => [...m, { id: tempId, role: 'user', text }])
    setTyping(true)

    // Save user message to Supabase
    // Gemini API integration will be implemented later — message will be sent to Gemini for response
    // Real-time sentiment update from BERT will appear here
    if (authUserId) {
      await saveChatMessage(authUserId, 'user', text)
    }

    // Call FastAPI backend for Gemini + DistilBERT + DB saving
    try {
      const response = await sendChatMessageApi(text, messages);
      const data = response.data;
      
      // Update the UI with AI response (optimistic update since we no longer rely on realtime for this)
      setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: data.ai_reply }]);
    } catch (err) {
      console.error("ChatBot FastAPI error:", err)
      setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: "I'm having a little trouble reaching my backend right now. 💙" }]);
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="h-full flex flex-col glass-dark overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-900" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">MindWell AI</div>
            <div className="text-xs text-green-400">Online • Always here for you</div>
          </div>
          <Sparkles size={14} className="ml-auto text-purple-400" />
        </div>
        {/* Real-time sentiment update from BERT will appear here */}
        <div className="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-xs text-blue-300 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Sentiment: Calm & Positive (BERT placeholder)
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm'
                : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-white/5'}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot size={12} className="text-white" />
            </div>
            <div className="bg-slate-800/80 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 flex-shrink-0">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Share how you're feeling..."
            className="flex-1 bg-slate-800/50 border border-slate-700 focus:border-blue-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={send}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Send size={16} />
          </motion.button>
        </div>
        {/* Gemini API integration will be implemented later */}
        <p className="text-xs text-slate-600 mt-2 text-center">Gemini API integration will be implemented later</p>
      </div>
    </div>
  )
}
