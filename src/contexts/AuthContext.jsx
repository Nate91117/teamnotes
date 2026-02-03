import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for saved session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('teamnotes_user_id')
    if (savedUserId) {
      loadUser(savedUserId)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadUser(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) {
        console.error('Error loading user:', error)
        localStorage.removeItem('teamnotes_user_id')
        setUser(null)
        setProfile(null)
      } else {
        setUser({ id: data.id })
        setProfile(data)
      }
    } catch (err) {
      console.error('Error in loadUser:', err)
      localStorage.removeItem('teamnotes_user_id')
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !data) {
        return { error: { message: 'Invalid email or password' } }
      }

      // Save session
      localStorage.setItem('teamnotes_user_id', data.id)
      setUser({ id: data.id })
      setProfile(data)
      return { data, error: null }
    } catch (err) {
      console.error('Error in signIn:', err)
      return { error: { message: 'Login failed' } }
    }
  }

  async function signOut() {
    localStorage.removeItem('teamnotes_user_id')
    setUser(null)
    setProfile(null)
    return { error: null }
  }

  async function updateProfile(updates) {
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (data) {
      setProfile(data)
    }
    return { data, error }
  }

  async function changePassword(newPassword) {
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('profiles')
      .update({ password: newPassword })
      .eq('id', user.id)
      .select()
      .single()

    return { data, error }
  }

  async function signUp(email, password, displayName) {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (existing) {
        return { error: { message: 'An account with this email already exists' } }
      }

      // Create the profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email,
          password,
          display_name: displayName || email.split('@')[0]
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return { error: { message: 'Failed to create account' } }
      }

      // Check for pending invitations
      const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')

      // Add user to teams they were invited to
      if (invitations && invitations.length > 0) {
        for (const invitation of invitations) {
          // Add as team member
          await supabase
            .from('team_members')
            .insert({
              team_id: invitation.team_id,
              user_id: newProfile.id,
              role: 'member'
            })

          // Mark invitation as accepted
          await supabase
            .from('invitations')
            .update({ status: 'accepted' })
            .eq('id', invitation.id)
        }
      }

      // Log them in
      localStorage.setItem('teamnotes_user_id', newProfile.id)
      setUser({ id: newProfile.id })
      setProfile(newProfile)

      return {
        data: newProfile,
        error: null,
        joinedTeams: invitations?.length || 0
      }
    } catch (err) {
      console.error('Error in signUp:', err)
      return { error: { message: 'Sign up failed' } }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
