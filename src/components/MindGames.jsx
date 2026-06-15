import { useState, useEffect, useRef } from 'react'
import { submitGameBehaviorApi } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Wind, Timer, Puzzle, Smile, X, RotateCcw } from 'lucide-react'

const games = [
  { id: 'memory', title: 'Memory Match', icon: Brain, color: 'from-blue-500 to-cyan-500', bg: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/20', desc: 'Boost focus and memory with card matching', tag: 'Focus', emoji: '🧠' },
  { id: 'breathing', title: 'Color Breathing', icon: Wind, color: 'from-teal-500 to-green-500', bg: 'from-teal-500/10 to-green-500/10', border: 'border-teal-500/20', desc: 'Guided breathing with calming color transitions', tag: 'Calm', emoji: '🌬️' },
  { id: 'focus', title: 'Focus Timer', icon: Timer, color: 'from-purple-500 to-pink-500', bg: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/20', desc: 'Pomodoro-style focus challenge sessions', tag: 'Productivity', emoji: '⏱️' },
  { id: 'puzzle', title: 'Calm Puzzle', icon: Puzzle, color: 'from-amber-500 to-orange-500', bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20', desc: 'Relaxing puzzle to ease your mind', tag: 'Relax', emoji: '🧩' },
  { id: 'emoji', title: 'Emoji Mood Match', icon: Smile, color: 'from-rose-500 to-pink-500', bg: 'from-rose-500/10 to-pink-500/10', border: 'border-rose-500/20', desc: 'Match emotions to build self-awareness', tag: 'Awareness', emoji: '😊' },
]

export default function MindGames() {
  const [activeGame, setActiveGame] = useState(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mind Games 🎮</h1>
        <p className="text-slate-400 text-sm mt-1">Therapeutic mini-games to boost your mental wellness</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game, i) => (
          <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`glass rounded-2xl p-6 card-hover cursor-pointer bg-gradient-to-br ${game.bg} border ${game.border}`}
            onClick={() => setActiveGame(game)}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl`}>
                {game.emoji}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${game.color} text-white font-medium`}>{game.tag}</span>
            </div>
            <h3 className="font-semibold text-white mb-1">{game.title}</h3>
            <p className="text-sm text-slate-400">{game.desc}</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`mt-4 w-full py-2 rounded-xl bg-gradient-to-r ${game.color} text-white text-sm font-medium`}>
              Play Now
            </motion.button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {activeGame && <GameModal game={activeGame} onClose={() => setActiveGame(null)} />}
      </AnimatePresence>
    </div>
  )
}

function GameModal({ game, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{game.emoji}</span>
            <h2 className="text-xl font-bold text-white">{game.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {game.id === 'memory' && <MemoryGame />}
        {game.id === 'breathing' && <BreathingGame />}
        {game.id === 'focus' && <FocusTimer />}
        {game.id === 'puzzle' && <CalmPuzzle />}
        {game.id === 'emoji' && <EmojiMatch />}
      </motion.div>
    </motion.div>
  )
}

function MemoryGame() {
  const emojis = ['🌸', '🌊', '🌙', '⭐', '🌿', '🦋']
  const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5).map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))
  const [deck, setDeck] = useState(cards)
  const [selected, setSelected] = useState([])

  const startTime = useRef(Date.now())
  const moves = useRef(0)
  const isSolved = deck.every(c => c.matched)
  const solvedRef = useRef(false)
  solvedRef.current = isSolved

  useEffect(() => {
    return () => {
      submitGameBehaviorApi('Memory Match', {
        time_taken_seconds: (Date.now() - startTime.current) / 1000,
        total_moves: moves.current,
        completed: solvedRef.current
      }).catch(console.error)
    }
  }, [])

  const flip = (id) => {
    if (selected.length === 2) return
    const card = deck.find(c => c.id === id)
    if (card.flipped || card.matched) return
    moves.current += 1
    const newDeck = deck.map(c => c.id === id ? { ...c, flipped: true } : c)
    setDeck(newDeck)
    const newSelected = [...selected, id]
    setSelected(newSelected)
    if (newSelected.length === 2) {
      const [a, b] = newSelected.map(sid => newDeck.find(c => c.id === sid))
      setTimeout(() => {
        setDeck(d => d.map(c => {
          if (c.id === a.id || c.id === b.id) {
            return a.emoji === b.emoji ? { ...c, matched: true } : { ...c, flipped: false }
          }
          return c
        }))
        setSelected([])
      }, 800)
    }
  }

  const reset = () => { setDeck(cards.sort(() => Math.random() - 0.5)); setSelected([]) }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {deck.map(card => (
          <motion.button key={card.id} whileTap={{ scale: 0.95 }} onClick={() => flip(card.id)}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${card.flipped || card.matched ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-slate-700 border border-slate-600'} ${card.matched ? 'opacity-50' : ''}`}>
            {card.flipped || card.matched ? card.emoji : '?'}
          </motion.button>
        ))}
      </div>
      <button onClick={reset} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <RotateCcw size={14} /> Reset Game
      </button>
    </div>
  )
}

function BreathingGame() {
  const [phase, setPhase] = useState('idle')
  const phases = { inhale: { label: 'Inhale', duration: 4, color: '#60a5fa' }, hold: { label: 'Hold', duration: 4, color: '#a78bfa' }, exhale: { label: 'Exhale', duration: 6, color: '#34d399' } }
  const phaseOrder = ['inhale', 'hold', 'exhale']

  const startTime = useRef(Date.now())
  
  useEffect(() => {
    return () => {
      submitGameBehaviorApi('Breathing Game', {
        time_taken_seconds: (Date.now() - startTime.current) / 1000,
        completed: true 
      }).catch(console.error)
    }
  }, [])

  const start = () => {
    let i = 0
    setPhase('inhale')
    const cycle = () => {
      i = (i + 1) % 3
      setPhase(phaseOrder[i])
      setTimeout(cycle, phases[phaseOrder[i]].duration * 1000)
    }
    setTimeout(cycle, phases.inhale.duration * 1000)
  }

  const current = phase !== 'idle' ? phases[phase] : null

  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-6">
        <motion.div animate={phase !== 'idle' ? { scale: phase === 'inhale' ? 1.3 : phase === 'hold' ? 1.3 : 1, opacity: 1 } : { scale: 1 }}
          transition={{ duration: current?.duration || 0.3, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${current?.color || '#334155'}40, ${current?.color || '#334155'}10)`, border: `2px solid ${current?.color || '#334155'}` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl">🌬️</div>
            {current && <div className="text-xs font-medium mt-1" style={{ color: current.color }}>{current.label}</div>}
          </div>
        </div>
      </div>
      {phase === 'idle' ? (
        <button onClick={start} className="px-6 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 text-white font-medium">Start Breathing</button>
      ) : (
        <div className="text-slate-300 text-sm">Follow the circle... breathe naturally</div>
      )}
    </div>
  )
}

function FocusTimer() {
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [intervalId, setIntervalId] = useState(null)

  const startTime = useRef(Date.now())
  
  useEffect(() => {
    return () => {
      submitGameBehaviorApi('Focus Timer', {
        time_taken_seconds: (Date.now() - startTime.current) / 1000,
        completed: false
      }).catch(console.error)
    }
  }, [])

  const toggle = () => {
    if (running) { clearInterval(intervalId); setRunning(false) }
    else {
      const id = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000)
      setIntervalId(id); setRunning(true)
    }
  }
  const reset = () => { clearInterval(intervalId); setSeconds(25 * 60); setRunning(false) }
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  const progress = ((25 * 60 - seconds) / (25 * 60)) * 100

  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#a78bfa" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{m}:{s}</span>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={toggle} className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm">
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} className="px-5 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm">Reset</button>
      </div>
    </div>
  )
}

function CalmPuzzle() {
  const size = 3
  const solved = Array.from({ length: size * size }, (_, i) => i)
  const [tiles, setTiles] = useState(() => [...solved].sort(() => Math.random() - 0.5))

  const startTime = useRef(Date.now())
  const moves = useRef(0)
  const isSolved = tiles.join(',') === solved.join(',')
  const solvedRef = useRef(false)
  solvedRef.current = isSolved

  useEffect(() => {
    return () => {
      submitGameBehaviorApi('Calm Puzzle', {
        time_taken_seconds: (Date.now() - startTime.current) / 1000,
        total_moves: moves.current,
        completed: solvedRef.current
      }).catch(console.error)
    }
  }, [])

  const move = (i) => {
    moves.current += 1
    const empty = tiles.indexOf(0)
    const row = Math.floor(i / size), col = i % size
    const eRow = Math.floor(empty / size), eCol = empty % size
    if (Math.abs(row - eRow) + Math.abs(col - eCol) === 1) {
      const newTiles = [...tiles]
      ;[newTiles[i], newTiles[empty]] = [newTiles[empty], newTiles[i]]
      setTiles(newTiles)
    }
  }


  return (
    <div className="text-center">
      {isSolved && <div className="text-green-400 font-semibold mb-3">🎉 Puzzle Solved!</div>}
      <div className="grid grid-cols-3 gap-1.5 w-48 mx-auto mb-4">
        {tiles.map((t, i) => (
          <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => move(i)}
            className={`aspect-square rounded-lg text-lg font-bold transition-all ${t === 0 ? 'bg-transparent' : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-white hover:border-amber-400/50'}`}>
            {t !== 0 && t}
          </motion.button>
        ))}
      </div>
      <button onClick={() => setTiles([...solved].sort(() => Math.random() - 0.5))} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mx-auto">
        <RotateCcw size={12} /> Shuffle
      </button>
    </div>
  )
}

function EmojiMatch() {
  const pairs = [['😊', 'Happy'], ['😢', 'Sad'], ['😰', 'Anxious'], ['😤', 'Frustrated'], ['😌', 'Calm'], ['🤩', 'Excited']]
  const [selected, setSelected] = useState(null)
  const [matched, setMatched] = useState([])
  const [score, setScore] = useState(0)

  const startTime = useRef(Date.now())
  const mistakes = useRef(0)
  const scoreRef = useRef(0)
  scoreRef.current = score

  useEffect(() => {
    return () => {
      submitGameBehaviorApi('Emoji Match', {
        time_taken_seconds: (Date.now() - startTime.current) / 1000,
        mistakes: mistakes.current,
        score: scoreRef.current,
        completed: scoreRef.current === pairs.length
      }).catch(console.error)
    }
  }, [pairs.length])

  const shuffledEmojis = pairs.map(p => p[0]).sort(() => Math.random() - 0.5)
  const shuffledWords = pairs.map(p => p[1]).sort(() => Math.random() - 0.5)

  const select = (item, type) => {
    if (!selected) { setSelected({ item, type }); return }
    const pair = pairs.find(p => (type === 'word' ? p[0] === selected.item && p[1] === item : p[1] === selected.item && p[0] === item))
    if (pair) { setMatched(m => [...m, pair[0], pair[1]]); setScore(s => s + 1) }
    else { mistakes.current += 1 }
    setSelected(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-slate-400">Match the emotion!</span>
        <span className="text-sm font-bold text-white">Score: {score}/{pairs.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {shuffledEmojis.map((e, i) => (
            <button key={i} onClick={() => !matched.includes(e) && select(e, 'emoji')}
              className={`w-full py-2 rounded-xl text-xl transition-all ${matched.includes(e) ? 'opacity-30' : selected?.item === e ? 'bg-blue-500/30 border border-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {shuffledWords.map((w, i) => (
            <button key={i} onClick={() => !matched.includes(w) && select(w, 'word')}
              className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${matched.includes(w) ? 'opacity-30' : selected?.item === w ? 'bg-purple-500/30 border border-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
