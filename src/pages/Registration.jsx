import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, Shield, Calendar, Heart, ArrowRight, ArrowLeft, Sparkles, Brain, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { signUp, signIn, upsertUserProfile } from '../lib/db'

const regSteps = ['Personal Info', 'Contact', 'Security & DOB']

export default function Registration({ onRegistered, onTherapistLogin }) {
  const [tab, setTab] = useState('signup') // 'signup' | 'login'

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">MindWell</span>
          </div>
          <p className="text-slate-400 text-sm">Your AI-powered mental wellness companion</p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex glass rounded-2xl p-1 mb-4">
          {['signup', 'login'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${tab === t ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              {t === 'signup' ? '✨ Sign Up' : '🔑 Login'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'signup'
            ? <SignUpForm key="signup" onRegistered={onRegistered} />
            : <LoginForm key="login" />}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }} className="text-center mt-6">
          <button onClick={onTherapistLogin} className="text-slate-400 hover:text-teal-400 text-sm transition-colors flex items-center gap-1 mx-auto">
            <Heart size={14} /> Are you a therapist? Access Therapist Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  )
}

// ─── SIGN UP ──────────────────────────────────────────────────────────────────
function SignUpForm({ onRegistered, setIsRegistering }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', phone: '', guardianPhone: '', dob: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState('')

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (step === 0 && !form.name.trim()) e.name = 'Name is required'
    if (step === 1) {
      if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
      if (!form.phone.match(/^\d{10}$/)) e.phone = '10-digit phone required'
      if (!form.guardianPhone.match(/^\d{10}$/)) e.guardianPhone = '10-digit guardian number required'
    }
    if (step === 2) {
      if (!form.dob) e.dob = 'Date of birth required'
      if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => { setStep(s => s - 1); setServerError('') }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    setServerError('')
    if (setIsRegistering) setIsRegistering(true)

    const age = new Date().getFullYear() - new Date(form.dob).getFullYear()
    const category = age <= 18 ? 'minor' : 'adult'

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await signUp(form.email, form.password)
    console.log("Supabase Auth Response:", { authData, authError })
    
    if (authError) { 
      setServerError(authError.message); 
      setLoading(false); 
      if (setIsRegistering) setIsRegistering(false); 
      return 
    }

    const userId = authData?.user?.id
    if (!userId) { 
      setServerError('Signup failed. This email might already be registered, or check console for details.'); 
      setLoading(false); 
      if (setIsRegistering) setIsRegistering(false);
      return 
    }

    // 2. Save profile to users table
    const { error: profileError } = await upsertUserProfile(userId, { ...form, category })
    if (profileError) { 
      console.error("Profile Save Error:", profileError)
      setServerError(`Database Error: ${profileError.message || profileError.details || 'Failed to save profile'}`); 
      setLoading(false); 
      if (setIsRegistering) setIsRegistering(false);
      return 
    }

    setLoading(false)
    onRegistered({ ...form, age, category })
  }

  const age = form.dob ? new Date().getFullYear() - new Date(form.dob).getFullYear() : null

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-8 shadow-2xl">
      {/* Step progress */}
      <div className="flex items-center gap-2 mb-6">
        {regSteps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${i <= step ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < regSteps.length - 1 && <div className={`flex-1 h-0.5 transition-all duration-500 ${i < step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-white mb-5">{regSteps[step]}</h2>

      {serverError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{serverError}</div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
          {step === 0 && (
            <InputField icon={<User size={15} />} label="Full Name" value={form.name} onChange={v => update('name', v)} placeholder="Enter your full name" error={errors.name} />
          )}
          {step === 1 && (
            <div className="space-y-4">
              <InputField icon={<Mail size={15} />} label="Email Address" type="email" value={form.email} onChange={v => update('email', v)} placeholder="your@email.com" error={errors.email} />
              <InputField icon={<Phone size={15} />} label="Phone Number" value={form.phone} onChange={v => update('phone', v)} placeholder="10-digit number" error={errors.phone} />
              <InputField icon={<Shield size={15} />} label="Guardian's Number" value={form.guardianPhone} onChange={v => update('guardianPhone', v)} placeholder="Guardian's 10-digit number" error={errors.guardianPhone} />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <InputField icon={<Calendar size={15} />} label="Date of Birth" type="date" value={form.dob} onChange={v => update('dob', v)} error={errors.dob} />
              {age !== null && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-300">
                    {age <= 18 ? `👶 Categorized as Minor (age ${age})` : `🧑 Categorized as Adult (age ${age})`}
                  </p>
                </motion.div>
              )}
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Password</label>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border transition-all ${errors.password ? 'border-red-500/50' : 'border-slate-700 focus-within:border-blue-500/50'}`}>
                  <Lock size={15} className="text-slate-400" />
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
                    placeholder="Min. 6 characters" className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm" />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="text-slate-400 hover:text-white">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button onClick={back} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all text-sm">
            <ArrowLeft size={15} /> Back
          </button>
        )}
        <button onClick={step < regSteps.length - 1 ? next : submit} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-sm">
          {loading ? <Spinner /> : step < regSteps.length - 1 ? <><span>Next</span><ArrowRight size={15} /></> : <><Sparkles size={15} /><span>Create Account</span></>}
        </button>
      </div>
    </motion.div>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [success, setSuccess] = useState(false)

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    setServerError('')
    const { error } = await signIn(form.email, form.password)
    if (error) { setServerError(error.message); setLoading(false); return }
    setSuccess(true)
    // useAuth hook in App.jsx will detect the session change and redirect automatically
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Welcome back! 🎉</h3>
        <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass rounded-2xl p-8 shadow-2xl">
      <h2 className="text-lg font-semibold text-white mb-5">Welcome Back 👋</h2>

      {serverError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{serverError}</div>
      )}

      <div className="space-y-4">
        <InputField icon={<Mail size={15} />} label="Email Address" type="email" value={form.email} onChange={v => update('email', v)} placeholder="your@email.com" error={errors.email} />
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Password</label>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border transition-all ${errors.password ? 'border-red-500/50' : 'border-slate-700 focus-within:border-blue-500/50'}`}>
            <Lock size={15} className="text-slate-400" />
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
              placeholder="Your password" className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm" />
            <button type="button" onClick={() => setShowPw(p => !p)} className="text-slate-400 hover:text-white">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
        </div>
      </div>

      <button onClick={submit} disabled={loading}
        className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-sm">
        {loading ? <Spinner /> : '🔑 Sign In'}
      </button>
    </motion.div>
  )
}

// ─── SHARED ───────────────────────────────────────────────────────────────────
function InputField({ icon, label, type = 'text', value, onChange, placeholder, error }) {
  return (
    <div>
      <label className="text-sm text-slate-400 mb-1.5 block">{label}</label>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border transition-all ${error ? 'border-red-500/50' : 'border-slate-700 focus-within:border-blue-500/50'}`}>
        <span className="text-slate-400">{icon}</span>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm" />
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function Spinner() {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
  )
}
