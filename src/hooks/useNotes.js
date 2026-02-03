import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../contexts/TeamContext'

export function useNotes() {
  const { user } = useAuth()
  const { currentTeam } = useTeam()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && currentTeam) {
      fetchNotes()
      const unsubscribe = subscribeToNotes()
      return () => unsubscribe?.()
    } else {
      setNotes([])
      setLoading(false)
    }
  }, [user, currentTeam])

  async function fetchNotes() {
    if (!user || !currentTeam) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          tasks (id, title)
        `)
        .eq('user_id', user.id)
        .eq('team_id', currentTeam.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching notes:', error)
        setNotes([])
      } else {
        setNotes(data || [])
      }
    } catch (err) {
      console.error('Error fetching notes:', err)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  function subscribeToNotes() {
    if (!user || !currentTeam) return

    const subscription = supabase
      .channel(`notes-${user.id}-${currentTeam.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${user.id}`
      }, fetchNotes)
      .subscribe()

    return () => subscription.unsubscribe()
  }

  async function createNote({ title, content = '', linked_task_id = null, shared_to_dashboard = false }) {
    if (!user || !currentTeam) return { error: 'Not authenticated or no team' }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        team_id: currentTeam.id,
        title,
        content,
        linked_task_id,
        shared_to_dashboard,
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        tasks (id, title)
      `)
      .single()

    if (!error && data) {
      setNotes([data, ...notes])
    }
    return { data, error }
  }

  async function updateNote(id, updates) {
    const { data, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        tasks (id, title)
      `)
      .single()

    if (!error && data) {
      setNotes(notes.map(n => n.id === id ? data : n))
    }
    return { data, error }
  }

  async function deleteNote(id) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (!error) {
      setNotes(notes.filter(n => n.id !== id))
    }
    return { error }
  }

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes: fetchNotes
  }
}

export default useNotes
