import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../contexts/TeamContext'

// Returns the YYYY-MM-DD string of the Sunday that starts the week containing `date`
function getWeekId(date = new Date()) {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // back up to Sunday
  return d.toISOString().split('T')[0]
}

// Returns the due_date for a weekly instance: sundayStr + weeklyDay days
function getWeeklyDueDate(sundayStr, weeklyDay) {
  const d = new Date(sundayStr + 'T12:00:00')
  d.setDate(d.getDate() + weeklyDay)
  return d.toISOString().split('T')[0]
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useTodoLists() {
  const { user } = useAuth()
  const { currentTeam } = useTeam()
  const [lists, setLists] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && currentTeam) {
      Promise.all([fetchLists(), fetchItems()]).then(() => {
        ensureWeeklyTasks()
        ensureMonthlyTasks()
      })
      const unsubLists = subscribeToLists()
      const unsubItems = subscribeToItems()
      return () => {
        unsubLists?.()
        unsubItems?.()
      }
    } else {
      setLists([])
      setItems([])
      setLoading(false)
    }
  }, [user, currentTeam])

  async function fetchLists() {
    if (!user || !currentTeam) return
    const { data, error } = await supabase
      .from('todo_lists')
      .select('*')
      .eq('user_id', user.id)
      .eq('team_id', currentTeam.id)
      .order('sort_order', { ascending: true })
    if (!error) setLists(data || [])
  }

  async function fetchItems() {
    if (!user || !currentTeam) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('todo_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', currentTeam.id)
        .order('sort_order', { ascending: true })
      if (!error) setItems(data || [])
    } catch (err) {
      console.error('Error fetching todo items:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function subscribeToLists() {
    if (!user || !currentTeam) return
    const sub = supabase
      .channel(`todo_lists-${user.id}-${currentTeam.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'todo_lists',
        filter: `user_id=eq.${user.id}`
      }, fetchLists)
      .subscribe()
    return () => sub.unsubscribe()
  }

  function subscribeToItems() {
    if (!user || !currentTeam) return
    const sub = supabase
      .channel(`todo_items-${user.id}-${currentTeam.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'todo_items',
        filter: `user_id=eq.${user.id}`
      }, fetchItems)
      .subscribe()
    return () => sub.unsubscribe()
  }

  // ── Lists CRUD ────────────────────────────────────────────────────────────

  async function createList(name) {
    if (!user || !currentTeam) return { error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('todo_lists')
      .insert({ user_id: user.id, team_id: currentTeam.id, name, sort_order: lists.length })
      .select()
      .single()
    if (!error) await fetchLists()
    return { data, error }
  }

  async function updateList(id, updates) {
    const { data, error } = await supabase
      .from('todo_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) await fetchLists()
    return { data, error }
  }

  async function deleteList(id) {
    const { error } = await supabase
      .from('todo_lists')
      .delete()
      .eq('id', id)
    if (!error) {
      setLists(prev => prev.filter(l => l.id !== id))
      await fetchItems() // items' list_id becomes null via ON DELETE SET NULL
    }
    return { error }
  }

  // ── Items CRUD ────────────────────────────────────────────────────────────

  async function createItem({
    title,
    description = '',
    list_id = null,
    due_date = null,
    is_weekly = false,
    weekly_day = null,
    is_monthly = false
  }) {
    if (!user || !currentTeam) return { error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('todo_items')
      .insert({
        user_id: user.id,
        team_id: currentTeam.id,
        title,
        description,
        list_id,
        due_date,
        completed: false,
        sort_order: 0,
        is_weekly,
        weekly_day: is_weekly ? weekly_day : null,
        is_monthly
      })
      .select()
      .single()
    if (!error) await fetchItems()
    return { data, error }
  }

  async function updateItem(id, updates) {
    const { data, error } = await supabase
      .from('todo_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) await fetchItems()
    return { data, error }
  }

  async function toggleItem(id) {
    const item = items.find(i => i.id === id)
    if (!item) return { error: 'Item not found' }
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i))
    const { error } = await supabase
      .from('todo_items')
      .update({ completed: !item.completed })
      .eq('id', id)
    if (error) {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === id ? { ...i, completed: item.completed } : i))
    }
    return { error }
  }

  async function deleteItem(id) {
    const { error } = await supabase
      .from('todo_items')
      .delete()
      .eq('id', id)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
    return { error }
  }

  // ── Weekly recurrence ─────────────────────────────────────────────────────

  async function createWeeklyInstance(template, weekId) {
    if (!user || !currentTeam) return
    await supabase
      .from('todo_items')
      .insert({
        user_id: template.user_id,
        team_id: template.team_id,
        list_id: template.list_id,
        title: template.title,
        description: template.description || '',
        completed: false,
        due_date: getWeeklyDueDate(weekId, template.weekly_day),
        sort_order: 0,
        is_weekly: true,
        weekly_day: template.weekly_day,
        weekly_source_id: template.id,
        weekly_week: weekId
      })
  }

  async function ensureWeeklyTasks() {
    if (!user || !currentTeam) return
    const weekId = getWeekId()
    try {
      const { data: templates } = await supabase
        .from('todo_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', currentTeam.id)
        .eq('is_weekly', true)
        .is('weekly_source_id', null)

      if (!templates || templates.length === 0) return

      const templateIds = templates.map(t => t.id)
      const { data: existing } = await supabase
        .from('todo_items')
        .select('weekly_source_id')
        .in('weekly_source_id', templateIds)
        .eq('weekly_week', weekId)

      const existingIds = new Set((existing || []).map(i => i.weekly_source_id))
      const toCreate = templates.filter(t => !existingIds.has(t.id))

      for (const template of toCreate) {
        await createWeeklyInstance(template, weekId)
      }
      if (toCreate.length > 0) await fetchItems()
    } catch (err) {
      console.error('Error ensuring weekly tasks:', err)
    }
  }

  // ── Monthly recurrence ────────────────────────────────────────────────────

  async function createMonthlyInstance(template, month) {
    if (!user || !currentTeam) return
    await supabase
      .from('todo_items')
      .insert({
        user_id: template.user_id,
        team_id: template.team_id,
        list_id: template.list_id,
        title: template.title,
        description: template.description || '',
        completed: false,
        due_date: null,
        sort_order: 0,
        is_monthly: true,
        monthly_source_id: template.id,
        monthly_month: month
      })
  }

  async function ensureMonthlyTasks() {
    if (!user || !currentTeam) return
    const month = getCurrentMonth()
    try {
      const { data: templates } = await supabase
        .from('todo_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', currentTeam.id)
        .eq('is_monthly', true)
        .is('monthly_source_id', null)

      if (!templates || templates.length === 0) return

      const templateIds = templates.map(t => t.id)
      const { data: existing } = await supabase
        .from('todo_items')
        .select('monthly_source_id')
        .in('monthly_source_id', templateIds)
        .eq('monthly_month', month)

      const existingIds = new Set((existing || []).map(i => i.monthly_source_id))
      const toCreate = templates.filter(t => !existingIds.has(t.id))

      for (const template of toCreate) {
        await createMonthlyInstance(template, month)
      }
      if (toCreate.length > 0) await fetchItems()
    } catch (err) {
      console.error('Error ensuring monthly tasks:', err)
    }
  }

  // Derived: items shown in the timeline (instances only, not templates)
  const visibleItems = items.filter(i => {
    if (i.is_weekly && !i.weekly_source_id) return false  // weekly template
    if (i.is_monthly && !i.monthly_source_id) return false // monthly template
    return true
  })

  const weeklyTemplates = items.filter(i => i.is_weekly && !i.weekly_source_id)
  const monthlyTemplates = items.filter(i => i.is_monthly && !i.monthly_source_id)

  return {
    lists,
    items,
    visibleItems,
    weeklyTemplates,
    monthlyTemplates,
    loading,
    createList,
    updateList,
    deleteList,
    createItem,
    updateItem,
    toggleItem,
    deleteItem,
    ensureWeeklyTasks,
    ensureMonthlyTasks,
    refreshItems: fetchItems
  }
}

export default useTodoLists
