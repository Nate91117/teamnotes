import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../contexts/TeamContext'

export function usePersonalGoals() {
  const { user } = useAuth()
  const { currentTeam } = useTeam()
  const [personalGoals, setPersonalGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())

  useEffect(() => {
    if (user && currentTeam) {
      fetchPersonalGoals()
      const unsubscribe = subscribeToPersonalGoals()
      return () => unsubscribe?.()
    } else {
      setPersonalGoals([])
      setLoading(false)
    }
  }, [user, currentTeam, yearFilter])

  async function fetchPersonalGoals() {
    if (!user || !currentTeam) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('personal_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', currentTeam.id)
        .eq('year', yearFilter)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error fetching personal goals:', error)
        setPersonalGoals([])
      } else {
        // Fetch linked team goals for each personal goal
        const goalsWithLinks = await Promise.all(
          (data || []).map(async (goal) => {
            const { data: links } = await supabase
              .from('goal_personal_goal_links')
              .select('goal_id')
              .eq('personal_goal_id', goal.id)

            // Fetch linked tasks
            const { data: linkedTasks } = await supabase
              .from('tasks')
              .select('id, title, status, due_date')
              .eq('linked_personal_goal_id', goal.id)

            return {
              ...goal,
              linked_goal_ids: (links || []).map(l => l.goal_id),
              linked_tasks: linkedTasks || []
            }
          })
        )
        setPersonalGoals(goalsWithLinks)
      }
    } catch (err) {
      console.error('Error fetching personal goals:', err)
      setPersonalGoals([])
    } finally {
      setLoading(false)
    }
  }

  function subscribeToPersonalGoals() {
    if (!user || !currentTeam) return

    const subscription = supabase
      .channel(`personal-goals-${user.id}-${currentTeam.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'personal_goals',
        filter: `user_id=eq.${user.id}`
      }, fetchPersonalGoals)
      .subscribe()

    return () => subscription.unsubscribe()
  }

  async function createPersonalGoal({ title, description = '', year, linked_goal_ids = [] }) {
    if (!user || !currentTeam) return { error: 'Not authenticated or no team' }

    const { data, error } = await supabase
      .from('personal_goals')
      .insert({
        user_id: user.id,
        team_id: currentTeam.id,
        title,
        description,
        year: year || yearFilter
      })
      .select()
      .single()

    if (!error && data) {
      // Create team goal links
      if (linked_goal_ids.length > 0) {
        await supabase
          .from('goal_personal_goal_links')
          .insert(linked_goal_ids.map(goalId => ({
            goal_id: goalId,
            personal_goal_id: data.id
          })))
      }
      await fetchPersonalGoals()
    }
    return { data, error }
  }

  async function updatePersonalGoal(id, updates) {
    const { linked_goal_ids, ...dbUpdates } = updates

    const { data, error } = await supabase
      .from('personal_goals')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (!error && data && linked_goal_ids !== undefined) {
      // Replace all links
      await supabase
        .from('goal_personal_goal_links')
        .delete()
        .eq('personal_goal_id', id)

      if (linked_goal_ids.length > 0) {
        await supabase
          .from('goal_personal_goal_links')
          .insert(linked_goal_ids.map(goalId => ({
            goal_id: goalId,
            personal_goal_id: id
          })))
      }
    }

    if (!error) {
      await fetchPersonalGoals()
    }
    return { data, error }
  }

  async function deletePersonalGoal(id) {
    const { error } = await supabase
      .from('personal_goals')
      .delete()
      .eq('id', id)

    if (!error) {
      setPersonalGoals(personalGoals.filter(g => g.id !== id))
    }
    return { error }
  }

  const activeGoals = personalGoals.filter(g => g.status === 'active')
  const completedGoals = personalGoals.filter(g => g.status === 'completed')

  return {
    personalGoals,
    activeGoals,
    completedGoals,
    loading,
    yearFilter,
    setYearFilter,
    createPersonalGoal,
    updatePersonalGoal,
    deletePersonalGoal,
    refreshPersonalGoals: fetchPersonalGoals
  }
}

export default usePersonalGoals
