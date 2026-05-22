import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getUserProfile } from '../lib/db'

export function useAuth() {
  const [authUser, setAuthUser] = useState(null)   // Supabase auth user
  const [profile, setProfile] = useState(null)     // users table row
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user ?? null
      setAuthUser(user)
      if (user) fetchProfile(user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setAuthUser(user)
      if (user) fetchProfile(user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)
    try {
      const { data, error } = await getUserProfile(userId)
      console.log("Fetch Profile Result:", { data, error })
      setProfile(data)
    } catch (err) {
      console.error("Error fetching profile:", err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  return { authUser, profile, loading, refetchProfile: () => authUser && fetchProfile(authUser.id) }
}
