import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../contexts/TeamContext'

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useTasks() {
  const { user } = useAuth()
  const { currentTeam } = useTeam()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && currentTeam) {
      fetchTasks().then(() => ensureMonthlyTasks())
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
        // Fetch assignees and personal goal links for all tasks
        const taskIds = (data || []).map(t => t.id)

        let assigneesMap = {}
        let pgLinksMap = {}

        if (taskIds.length > 0) {
          const [assigneesResult, pgLinksResult] = await Promise.all([
            supabase
              .from('task_assignees')
              .select('task_id, user_id')
              .in('task_id', taskIds),
            supabase
              .from('task_personal_goal_links')
              .select('task_id, personal_goal_id')
              .in('task_id', taskIds)
          ])

          ;(assigneesResult.data || []).forEach(a => {
            if (!assigneesMap[a.task_id]) assigneesMap[a.task_id] = []
            assigneesMap[a.task_id].push(a.user_id)
          })

          ;(pgLinksResult.data || []).forEach(l => {
            if (!pgLinksMap[l.task_id]) pgLinksMap[l.task_id] = []
            pgLinksMap[l.task_id].push(l.personal_goal_id)
          })
        }

        const tasksWithRelations = (data || []).map(t => ({
          ...t,
          assignees: assigneesMap[t.id] || [],
          linked_personal_goal_ids: pgLinksMap[t.id] || []
        }))

        setTasks(tasksWithRelations)
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
    notes = '',
    status = 'todo',
    linked_goal_id = null,
    linked_personal_goal_ids = [],
    assignee_ids = [],
    shared_to_dashboard = false,
    due_date = null,
    is_monthly = false
  }) {
    if (!user || !currentTeam) return { error: 'Not authenticated or no team' }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        team_id: currentTeam.id,
        title,
        description,
        notes,
        status,
        linked_goal_id,
        shared_to_dashboard,
        due_date,
        is_monthly
      })
      .select(`
        *,
        goals (id, title)
      `)
      .single()

    if (!error && data) {
      // Insert assignees
      if (assignee_ids.length > 0) {
        await supabase
          .from('task_assignees')
          .insert(assignee_ids.map(uid => ({
            task_id: data.id,
            user_id: uid
          })))
      }

      // Insert personal goal links
      if (linked_personal_goal_ids.length > 0) {
        await supabase
          .from('task_personal_goal_links')
          .insert(linked_personal_goal_ids.map(pgId => ({
            task_id: data.id,
            personal_goal_id: pgId
          })))
      }

      await fetchTasks()
    }
    return { data, error }
  }

  async function updateTask(id, updates) {
    const { assignee_ids, linked_personal_goal_ids, ...dbUpdates } = updates

    // Handle completed_at tracking
    if (dbUpdates.status === 'done') {
      dbUpdates.completed_at = new Date().toISOString()
    } else if (dbUpdates.status && dbUpdates.status !== 'done') {
      dbUpdates.completed_at = null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select(`
        *,
        goals (id, title)
      `)
      .single()

    if (!error && data) {
      // Update assignees if provided
      if (assignee_ids !== undefined) {
        await supabase
          .from('task_assignees')
          .delete()
          .eq('task_id', id)

        if (assignee_ids.length > 0) {
          await supabase
            .from('task_assignees')
            .insert(assignee_ids.map(uid => ({
              task_id: id,
              user_id: uid
            })))
        }
      }

      // Update personal goal links if provided
      if (linked_personal_goal_ids !== undefined) {
        await supabase
          .from('task_personal_goal_links')
          .delete()
          .eq('task_id', id)

        if (linked_personal_goal_ids.length > 0) {
          await supabase
            .from('task_personal_goal_links')
            .insert(linked_personal_goal_ids.map(pgId => ({
              task_id: id,
              personal_goal_id: pgId
            })))
        }
      }

      await fetchTasks()
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

  // Monthly task: create an instance (copy) for the current month
  async function createMonthlyInstance(sourceTask) {
    if (!user || !currentTeam) return { error: 'Not authenticated or no team' }

    const currentMonth = getCurrentMonth()

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: sourceTask.user_id,
        team_id: currentTeam.id,
        title: sourceTask.title,
        description: sourceTask.description || '',
        notes: sourceTask.notes || '',
        status: 'todo',
        linked_goal_id: sourceTask.linked_goal_id || null,
        shared_to_dashboard: sourceTask.shared_to_dashboard || false,
        due_date: sourceTask.due_date || null,
        is_monthly: true,
        monthly_source_id: sourceTask.id,
        monthly_month: currentMonth
      })
      .select()
      .single()

    if (!error && data) {
      // Copy assignees from source task
      const sourceAssignees = sourceTask.assignees || []
      if (sourceAssignees.length > 0) {
        await supabase
          .from('task_assignees')
          .insert(sourceAssignees.map(uid => ({
            task_id: data.id,
            user_id: uid
          })))
      }
    }

    return { data, error }
  }

  // Ensure monthly tasks have instances for the current month
  async function ensureMonthlyTasks() {
    if (!user || !currentTeam) return

    const currentMonth = getCurrentMonth()

    try {
      // Find monthly templates (is_monthly=true, monthly_source_id=null) for this user+team
      const { data: templates } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', currentTeam.id)
        .eq('is_monthly', true)
        .is('monthly_source_id', null)

      if (!templates || templates.length === 0) return

      // Check which templates already have instances for this month
      const templateIds = templates.map(t => t.id)
      const { data: existingInstances } = await supabase
        .from('tasks')
        .select('monthly_source_id')
        .in('monthly_source_id', templateIds)
        .eq('monthly_month', currentMonth)

      const existingSourceIds = new Set((existingInstances || []).map(i => i.monthly_source_id))

      // Also fetch assignees for templates that need instances
      const templatesToCreate = templates.filter(t => !existingSourceIds.has(t.id))
      if (templatesToCreate.length === 0) return

      const tIds = templatesToCreate.map(t => t.id)
      let assigneesMap = {}
      if (tIds.length > 0) {
        const { data: assigneesData } = await supabase
          .from('task_assignees')
          .select('task_id, user_id')
          .in('task_id', tIds)
        ;(assigneesData || []).forEach(a => {
          if (!assigneesMap[a.task_id]) assigneesMap[a.task_id] = []
          assigneesMap[a.task_id].push(a.user_id)
        })
      }

      // Create instances for templates that don't have one yet
      for (const template of templatesToCreate) {
        await createMonthlyInstance({ ...template, assignees: assigneesMap[template.id] || [] })
      }

      await fetchTasks()
    } catch (err) {
      console.error('Error ensuring monthly tasks:', err)
    }
  }

  // Filter helpers
  const standardTasks = tasks.filter(t => !t.is_monthly)
  const monthlyTemplates = tasks.filter(t => t.is_monthly && !t.monthly_source_id)
  const monthlyInstances = tasks.filter(t => t.is_monthly && t.monthly_source_id)

  const todoTasks = tasks.filter(t => t.status === 'todo').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  const onHoldTasks = tasks.filter(t => t.status === 'on_hold').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  const doneTasks = tasks.filter(t => t.status === 'done').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  return {
    tasks,
    standardTasks,
    monthlyTemplates,
    monthlyInstances,
    todoTasks,
    inProgressTasks,
    onHoldTasks,
    doneTasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    createMonthlyInstance,
    ensureMonthlyTasks,
    refreshTasks: fetchTasks
  }
}

export default useTasks
