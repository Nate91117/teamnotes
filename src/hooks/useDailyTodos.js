import { useState, useEffect } from 'react'

// Reads Nate's personal to-do list from the daily-helper app's read-only
// /api/todos endpoint (bearer-token auth) and maps each row into the shape
// WeeklyTimeline expects. Endpoint URL + token are injected at build time.
const API_URL = import.meta.env.VITE_TODOS_API_URL
const API_TOKEN = import.meta.env.VITE_TODOS_API_TOKEN

export function useDailyTodos() {
  const configured = Boolean(API_URL)
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(configured)

  useEffect(() => {
    if (!configured) return
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(API_URL, {
          headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {},
        })
        if (!res.ok) throw new Error(`todos fetch failed: ${res.status}`)
        const rows = await res.json()
        if (cancelled) return
        // Map to the WeeklyTimeline task shape. No status/assignees on personal
        // to-dos, so everything is a plain non-recurring "todo" owned by nobody.
        setTodos(
          rows.map(r => ({
            id: r.id,
            title: r.title,
            due_date: r.due_date,
            status: 'todo',
            is_weekly: false,
            is_monthly: false,
            assignees: [],
          }))
        )
      } catch (err) {
        if (!cancelled) {
          console.error('useDailyTodos:', err)
          setTodos([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [configured])

  return { todos, loading, configured }
}
