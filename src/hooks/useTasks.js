import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../contexts/TeamContext'

export function useTasks() {
  const { user } = useAuth()
  const { currentTeam } = useTeam()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && currentTeam) {
      fetchTasks()
      const unsubscribe = subscribeToTasks()
      return () => unsubscribe?.()
    } else {
      setTasks([])
      setLoading(false)
    }
  }, [user, currentTeam])

  async function fetchTasks() {
    if (!user || !currentTeam) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          goals (id, title)
        `)
        .eq('user_id', user.id)
        .eq('team_id', currentTeam.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tasks:', error)
        setTasks([])
      } else {
        setTasks(data || [])
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  function subscribeToTasks() {
    if (!user || !currentTeam) return

    const subscription = supabase
      .channel(`tasks-${user.id}-${currentTeam.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`
      }, fetchTasks)
      .subscribe()

    return () => subscription.unsubscribe()
  }

  async function createTask({
    title,
    description = '',
    status = 'todo',
    linked_goal_id = null,
    shared_to_dashboard = false,
    due_date = null
  }) {
    if (!user || !currentTeam) return { error: 'Not authenticated or no team' }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        team_id: currentTeam.id,
        title,
        description,
        status,
        linked_goal_id,
        shared_to_dashboard,
        due_date
      })
      .select(`
        *,
        goals (id, title)
      `)
      .single()

    if (!error && data) {
      setTasks([data, ...tasks])
    }
    return { data, error }
  }

  async function updateTask(id, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        goals (id, title)
      `)
      .single()

    if (!error && data) {
      setTasks(tasks.map(t => t.id === id ? data : t))
    }
    return { data, error }
  }

  async function deleteTask(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (!error) {
      setTasks(tasks.filter(t => t.id !== id))
    }
    return { error }
  }

  async function reorderTasks(reorderedTasks) {
    const updates = reorderedTasks.map((task, index) =>
      supabase
        .from('tasks')
        .update({ sort_order: index })
        .eq('id', task.id)
    )

    await Promise.all(updates)
    setTasks(reorderedTasks.map((t, i) => ({ ...t, sort_order: i })))
  }

  const todoTasks = tasks.filter(t => t.status === 'todo').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  const doneTasks = tasks.filter(t => t.status === 'done').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  return {
    tasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    refreshTasks: fetchTasks
  }
}

export default useTasks
