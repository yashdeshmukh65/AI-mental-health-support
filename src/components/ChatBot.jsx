import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Send, Bot, Sparkles, Mic, Volume2, VolumeX, Play, StopCircle } from 'lucide-react'
import { subscribeToChats, saveChatMessage, getChatHistory } from '../lib/db'
import { sendChatMessageApi } from '../lib/api'
import { toast } from '../lib/toast'

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
  const { t, i18n } = useTranslation()
  const [chatLanguage, setChatLanguage] = useState(i18n.language)

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceMuted, setVoiceMuted] = useState(false)
  const recognitionRef = useRef(null)

  const getSpeechLang = (lang) => {
    const map = { en: 'en-US', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN' }
    return map[lang] || 'en-US'
  }

  // Keep chatLanguage in sync initially but allow divergence
  useEffect(() => {
    setChatLanguage(i18n.language)
  }, [i18n.language])

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

  // Stop voice if component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support speech recognition.")
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = getSpeechLang(chatLanguage)
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    
    let finalTranscript = ''
    recognition.onresult = (event) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }
      // Populate input but wait for user to send manually
      setInput(finalTranscript + interimTranscript)
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognition.start()
    toast.success('Voice recognition started. Speak now.')
    recognitionRef.current = recognition
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    toast.success('Voice recognition stopped.')
  }

  const speakResponse = (text) => {
    if (voiceMuted || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = getSpeechLang(chatLanguage)
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const replayVoice = (text) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = getSpeechLang(chatLanguage)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const send = async () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')

    // Optimistic UI — add user message immediately
    const tempId = Date.now()
    setMessages(m => [...m, { id: tempId, role: 'user', text }])
    setTyping(true)

    // Call FastAPI backend for Gemini + DistilBERT + DB saving
    try {
      const data = await sendChatMessageApi(text, messages, chatLanguage);
      
      // Update the UI with AI response (optimistic update since we no longer rely on realtime for this)
      setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: data.ai_reply }]);
      
      speakResponse(data.ai_reply);
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
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-white/10 shadow-lg shadow-blue-500/10">
              <img src="/logo.png" alt="MindWell Logo" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-900" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">MindWell AI</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button 
              onClick={() => {
                const newMutedState = !voiceMuted
                setVoiceMuted(newMutedState)
                if (newMutedState && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel()
                  setIsSpeaking(false)
                }
              }}
              className={`p-1.5 rounded-lg transition-colors ${voiceMuted ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10'}`}
              title={voiceMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {voiceMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <select
              value={chatLanguage}
              onChange={(e) => setChatLanguage(e.target.value)}
              className="bg-slate-800 text-slate-300 text-xs border border-white/5 rounded px-2 py-1 outline-none focus:border-blue-500/50"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
              <option value="ta">தமிழ்</option>
            </select>
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
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0 mt-1 border border-white/10">
                  <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col gap-1 items-start max-w-[80%]">
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm'
                  : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-white/5'}`}>
                  {msg.text}
                </div>
                {msg.role === 'ai' && (
                  <button onClick={() => replayVoice(msg.text)} className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 ml-2 transition-colors">
                    <Play size={10} /> Replay
                  </button>
                )}
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
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={isListening ? stopListening : startListening}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-white/5'}`}>
            {isListening ? <StopCircle size={18} /> : <Mic size={18} />}
          </motion.button>
          
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={isListening ? "Listening..." : t('chat.placeholder')}
            className="flex-1 bg-slate-800/50 border border-slate-700 focus:border-blue-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={send}
            title={t('chat.send')}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
