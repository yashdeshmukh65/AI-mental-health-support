import { supabase } from './supabase'

// ─── AUTH ────────────────────────────────────────────────────────────────────
export async function signUp(email, password) {
  return await supabase.auth.signUp({ email, password })
}
export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password })
}
export async function signOut() {
  return await supabase.auth.signOut()
}
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session, error }
}

// ─── USERS TABLE ─────────────────────────────────────────────────────────────
export async function upsertUserProfile(userId, profile) {
  return await supabase.from('users').upsert({
    id: userId,
    full_name: profile.name,
    email: profile.email,
    phone: profile.phone,
    guardian_number: profile.guardianPhone,
    dob: profile.dob,
    category: profile.category,
  }, { onConflict: 'id' }).select().single()
}
export async function getUserProfile(userId) {
  return await supabase.from('users').select('*').eq('id', userId).single()
}

// ─── ASSESSMENTS & INITIALIZATIONS ───────────────────────────────────────────
export async function saveAssessment(userId, category, answers) {
  // 1. Save assessment
  const { data, error } = await supabase.from('assessments').insert({
    user_id: userId, category, answers, completed_at: new Date().toISOString()
  }).select().single()

  if (!error) {
    // 2. Create initial wellness score
    await supabase.from('wellness_scores').upsert({
      user_id: userId, overall_score: 80, burnout_risk: 'Low', emotional_stability: 85, recovery_progress: 50
    }, { onConflict: 'user_id' })
    // 3. Create initial streak
    await supabase.from('streaks').upsert({
      user_id: userId, current_streak: 1, total_xp: 50, last_activity_date: new Date().toISOString().split('T')[0]
    }, { onConflict: 'user_id' })
  }
  return { data, error }
}
export async function getLatestAssessment(userId) {
  return await supabase.from('assessments').select('*').eq('user_id', userId).order('completed_at', { ascending: false }).limit(1).single()
}

// ─── CHAT MESSAGES ───────────────────────────────────────────────────────────
export async function saveChatMessage(userId, role, message) {
  return await supabase.from('chat_messages').insert({ user_id: userId, role, message })
}
export async function getChatHistory(userId, limit = 50) {
  const { data, error } = await supabase.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }).limit(limit)
  return { data: data || [], error }
}
export function subscribeToChats(userId, callback) {
  return supabase.channel('chats')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${userId}` }, callback)
    .subscribe()
}

// ─── WELLNESS PROGRESS & STREAKS ─────────────────────────────────────────────
export async function awardPoints(userId, amount) {
  const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', userId).single()
  if (streakData) {
    await supabase.from('streaks').update({ total_xp: (streakData.total_xp || 0) + amount }).eq('user_id', userId)
  } else {
    // If no streak exists, create one
    await supabase.from('streaks').insert({ user_id: userId, current_streak: 1, total_xp: amount, last_activity_date: new Date().toISOString().split('T')[0] })
  }
}

export async function saveTaskProgress(userId, taskId, completed, xpReward = 10) {
  const { data, error } = await supabase.from('wellness_progress').upsert({
    user_id: userId, task_id: taskId, completed, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,task_id' }).select().single()

  if (completed && !error) {
    // Update XP in streaks table
    await awardPoints(userId, xpReward)
    
    // Increment Wellness Score slightly for completing a task
    const { data: scoreData } = await supabase.from('wellness_scores').select('*').eq('user_id', userId).single()
    if (scoreData) {
      const newOverall = Math.min(100, (scoreData.overall_score || 0) + 2)
      const newStability = Math.min(100, (scoreData.emotional_stability || 0) + 1)
      const newRecovery = Math.min(100, (scoreData.recovery_progress || 0) + 2)
      await supabase.from('wellness_scores').update({
        overall_score: newOverall,
        emotional_stability: newStability,
        recovery_progress: newRecovery,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId)
    }
  }
  return { data, error }
}
export async function getWellnessProgress(userId) {
  const { data, error } = await supabase.from('wellness_progress').select('task_id, completed').eq('user_id', userId)
  const map = {}
  if (data) data.forEach(r => { map[r.task_id] = r.completed })
  return { data: map, error }
}
export async function getStreaks(userId) {
  return await supabase.from('streaks').select('*').eq('user_id', userId).single()
}

// ─── MOOD LOGS & SENTIMENT ───────────────────────────────────────────────────
export async function saveMoodLog(userId, day, note) {
  // Generate random dummy score for hackathon demonstration
  const moodScore = Math.floor(Math.random() * 40) + 60; // 60-100
  const stressScore = Math.floor(Math.random() * 50); // 0-50
  
  const { data, error } = await supabase.from('mood_logs').upsert({
    user_id: userId, day, note, mood_score: moodScore, stress_score: stressScore, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,day' }).select().single()

  if (!error) {
    await awardPoints(userId, 10)
    await calculateWellnessScore(userId)
  }
  return { data, error }
}
export async function getMoodLogs(userId) {
  const { data, error } = await supabase.from('mood_logs').select('*').eq('user_id', userId).order('day', { ascending: true })
  return { data: data || [], error }
}
export async function getSentimentLogs(userId) {
  return await supabase.from('sentiment_logs').select('*').eq('user_id', userId).order('created_at', { ascending: true })
}

// ─── THERAPISTS & BOOKINGS (NOTIFICATIONS) ───────────────────────────────────
export async function getTherapists() {
  const { data, error } = await supabase.from('therapists').select('*')
  return { data: data || [], error }
}
export async function bookSession(userId, therapistName, date, time) {
  // Save booking as a notification for the therapist
  return await supabase.from('notifications').insert({
    user_id: userId, title: 'Session Booked', message: `Session booked with ${therapistName} for ${date} at ${time}.`, type: 'booking'
  })
}

// ─── WELLNESS SCORES & ANOMALY ALERTS ────────────────────────────────────────
export async function getWellnessScore(userId) {
  return await supabase.from('wellness_scores').select('*').eq('user_id', userId).single()
}
export function subscribeToWellnessScore(userId, callback) {
  return supabase.channel('wellness_scores')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wellness_scores', filter: `user_id=eq.${userId}` }, callback)
    .subscribe()
}
export async function getAnomalyAlerts(userId) {
  const { data, error } = await supabase.from('anomaly_alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  return { data: data || [], error }
}
export function subscribeToAnomalyAlerts(userId, callback) {
  return supabase.channel('anomaly_alerts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'anomaly_alerts', filter: `user_id=eq.${userId}` }, callback)
    .subscribe()
}

// ─── INTERNAL BACKEND LOGIC (Simulated) ──────────────────────────────────────
export async function calculateWellnessScore(userId) {
  // Simulates a backend job recalculating the overall score based on recent moods
  const { data: logs } = await supabase.from('mood_logs').select('mood_score, stress_score').eq('user_id', userId).limit(7)
  if (!logs || logs.length === 0) return
  
  const avgMood = logs.reduce((acc, l) => acc + l.mood_score, 0) / logs.length
  const avgStress = logs.reduce((acc, l) => acc + l.stress_score, 0) / logs.length
  const newOverall = Math.round(avgMood - (avgStress * 0.2))
  const stability = Math.round(avgMood)
  const burnoutRisk = avgStress > 60 ? 'High' : avgStress > 40 ? 'Medium' : 'Low'

  await supabase.from('wellness_scores').upsert({
    user_id: userId, overall_score: newOverall, burnout_risk: burnoutRisk, emotional_stability: stability, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
}
