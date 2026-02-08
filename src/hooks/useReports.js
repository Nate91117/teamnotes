import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../contexts/TeamContext'

export function useReports() {
  const { user } = useAuth()
  const { currentTeam } = useTeam()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && currentTeam) {
      fetchReports()
    } else {
      setReports([])
      setLoading(false)
    }
  }, [user, currentTeam])

  async function fetchReports() {
    if (!user || !currentTeam) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('team_id', currentTeam.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reports:', error)
        setReports([])
      } else {
        setReports(data || [])
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  async function createReport(title, assignedUserId) {
    if (!user || !currentTeam) return { error: 'Not authenticated or no team' }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        team_id: currentTeam.id,
        title,
        assigned_user_id: assignedUserId,
        created_by: user.id
      })
      .select()
      .single()

    if (!error && data) {
      setReports([data, ...reports])
    }
    return { data, error }
  }

  async function updateReport(id, updates) {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setReports(reports.map(r => r.id === id ? data : r))
    }
    return { data, error }
  }

  async function deleteReport(id) {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)

    if (!error) {
      setReports(reports.filter(r => r.id !== id))
    }
    return { error }
  }

  return {
    reports,
    loading,
    createReport,
    updateReport,
    deleteReport,
    refreshReports: fetchReports
  }
}

export default useReports
