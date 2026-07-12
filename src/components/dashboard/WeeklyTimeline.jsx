import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTeam } from '../../hooks/useTeam'

// Canonical task statuses with short labels + tint classes for the compact picker
const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', active: 'bg-gray-500 text-white', idle: 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600' },
  { value: 'in_progress', label: 'In Progress', active: 'bg-yellow-500 text-white', idle: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50' },
  { value: 'on_hold', label: 'On Hold', active: 'bg-orange-500 text-white', idle: 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50' },
  { value: 'done', label: 'Done', active: 'bg-green-600 text-white', idle: 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50' },
]

function getTodayCST() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date())
}

function buildWeekColumns(tasks, hideCompleted) {
  const today = getTodayCST()
  const dayMs = 24 * 60 * 60 * 1000
  const todayDate = new Date(today + 'T12:00:00')
  const dayOfWeek = todayDate.getDay() // 0=Sun, 1=Mon...6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const mondayDate = new Date(todayDate.getTime() - daysFromMonday * dayMs)

  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const dayColumns = DAY_NAMES.map((label, i) => {
    const d = new Date(mondayDate.getTime() + i * dayMs)
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'UTC' })
    return { key: `day-${i}`, label, dateStr, isToday: dateStr === today, tasks: [] }
  })

  const mondayStr = dayColumns[0].dateStr
  const sundayStr = dayColumns[6].dateStr
  const nextMondayDate = new Date(mondayDate.getTime() + 7 * dayMs)
  const nextSundayDate = new Date(mondayDate.getTime() + 13 * dayMs)
  const nextMondayStr = nextMondayDate.toLocaleDateString('en-CA', { timeZone: 'UTC' })
  const nextSundayStr = nextSundayDate.toLocaleDateString('en-CA', { timeZone: 'UTC' })

  const overdue = { key: 'overdue', label: 'Overdue', tasks: [] }
  const nextWeek = { key: 'next-week', label: 'Next Week', tasks: [] }
  const later = { key: 'later', label: 'Later', tasks: [] }

  const visible = hideCompleted ? tasks.filter(t => t.status !== 'done') : tasks

  for (const task of visible) {
    if (!task.due_date) continue
    // Plain YYYY-MM-DD strings would parse as UTC midnight (off-by-one in CST); use them directly.
    // Full ISO timestamps (noon UTC, from dateToNoonUTC) parse correctly via toLocaleDateString.
    const taskDateStr = /^\d{4}-\d{2}-\d{2}$/.test(task.due_date)
      ? task.due_date
      : new Date(task.due_date).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })

    if (taskDateStr < today) {
      const isWeekly = task.is_weekly || task.weekly_source_id
      if (isWeekly) {
        // Weekly tasks always live on their weekday — never overdue
        const taskDow = new Date(taskDateStr + 'T12:00:00').getDay() // 0=Sun…6=Sat
        const colIndex = taskDow === 0 ? 6 : taskDow - 1            // 0=Mon…6=Sun
        dayColumns[colIndex].tasks.push(task)
      } else {
        overdue.tasks.push(task)
      }
    } else if (taskDateStr <= sundayStr) {
      const col = dayColumns.find(c => c.dateStr === taskDateStr)
      if (col) col.tasks.push(task)
    } else if (taskDateStr >= nextMondayStr && taskDateStr <= nextSundayStr) {
      nextWeek.tasks.push(task)
    } else {
      later.tasks.push(task)
    }
  }

  return { overdue, dayColumns, nextWeek, later }
}

function TaskItem({ task, showDate, onStatusChange }) {
  const isDone = task.status === 'done'
  const [editing, setEditing] = useState(false)
  const ref = useRef(null)
  const dateLabel = showDate && task.due_date
    ? (/^\d{4}-\d{2}-\d{2}$/.test(task.due_date)
        ? new Date(task.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : new Date(task.due_date).toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric' }))
    : null

  // Dismiss the picker on Escape or an outside click
  useEffect(() => {
    if (!editing) return
    const onKey = (e) => { if (e.key === 'Escape') setEditing(false) }
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setEditing(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [editing])

  function pick(value) {
    if (value !== task.status) onStatusChange?.(task.id, value)
    setEditing(false)
  }

  return (
    <div
      data-task-item
      ref={ref}
      onDoubleClick={onStatusChange ? () => setEditing(true) : undefined}
      title={onStatusChange && !editing ? 'Double-click to change status' : undefined}
      className={`py-1 px-1.5 rounded select-none ${onStatusChange ? 'cursor-pointer' : ''} ${isDone && !editing ? 'opacity-50' : ''}`}
    >
      <span className={`text-xs leading-tight ${
        isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
      }`}>
        {task.title}
        {dateLabel && (
          <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-normal">{dateLabel}</span>
        )}
      </span>
      {editing && (
        <div className="mt-1 flex flex-wrap gap-1">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${opt.value === task.status ? opt.active : opt.idle}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TaskGroup({ label, tasks, showDate, onStatusChange }) {
  if (tasks.length === 0) return null
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5 px-1">
        {label}
      </p>
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} showDate={showDate} onStatusChange={onStatusChange} />
      ))}
    </div>
  )
}

function Column({ col, isOverdue, isLater, listMaxHeight, hiddenCount, onStatusChange }) {
  const baseClasses = 'min-w-[150px] max-w-[200px] rounded-xl border p-3 flex flex-col relative'
  const colorClasses = col.isToday
    ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/20 dark:border-primary-600'
    : isOverdue
    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'

  const headerColor = col.isToday
    ? 'text-primary-700 dark:text-primary-300'
    : isOverdue
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-500 dark:text-gray-400'

  const badgeColor = col.isToday
    ? 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-200'
    : isOverdue
    ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'

  const weekly = col.tasks.filter(t => t.is_weekly)
  const monthly = col.tasks.filter(t => t.is_monthly)
  const normal = col.tasks.filter(t => !t.is_weekly && !t.is_monthly)

  return (
    <div className={`${baseClasses} ${colorClasses}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${headerColor}`}>
          {col.label}
        </span>
        {col.tasks.length > 0 && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${badgeColor}`}>
            {col.tasks.length}
          </span>
        )}
      </div>
      <div
        data-col-list
        {...(isLater ? { 'data-later': '' } : {})}
        className="space-y-1.5 min-h-[20px]"
        style={isLater && listMaxHeight ? { maxHeight: listMaxHeight, overflow: 'hidden' } : undefined}
      >
        {col.tasks.length === 0 ? (
          <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-1.5">—</p>
        ) : isLater ? (
          col.tasks.map(task => <TaskItem key={task.id} task={task} showDate={false} onStatusChange={onStatusChange} />)
        ) : (
          <>
            <TaskGroup label="Weekly" tasks={weekly} showDate={isOverdue} onStatusChange={onStatusChange} />
            <TaskGroup label="Monthly" tasks={monthly} showDate={isOverdue} onStatusChange={onStatusChange} />
            <TaskGroup label="Tasks" tasks={normal} showDate={isOverdue} onStatusChange={onStatusChange} />
          </>
        )}
      </div>
      {isLater && hiddenCount > 0 && (
        <div className="absolute bottom-0 left-0 right-0 rounded-b-xl px-3 pb-2 pt-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 text-[10px] font-medium text-gray-400 dark:text-gray-500 pointer-events-none">
          + {hiddenCount} more
        </div>
      )}
    </div>
  )
}

export default function WeeklyTimeline({ standardTasks, monthlyInstances, loading, onStatusChange }) {
  const { user } = useAuth()
  const { members } = useTeam()
  const [show, setShow] = useState(true)
  const [hideCompleted, setHideCompleted] = useState(true)
  const [selectedMemberId, setSelectedMemberId] = useState(null) // null = default to current user

  const rowRef = useRef(null)
  const [innerMax, setInnerMax] = useState(null)   // tallest non-Later column's content height
  const [laterHidden, setLaterHidden] = useState(0) // Later tasks clipped by the cap

  const currentUserId = user?.id
  const activeFilter = selectedMemberId ?? currentUserId

  // Re-measure when the visible task set, filter, or visibility changes.
  const measureSig = `${standardTasks?.length ?? 0}|${monthlyInstances?.length ?? 0}|${hideCompleted}|${activeFilter}|${show}|${loading}`

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    const measure = () => {
      const lists = Array.from(row.querySelectorAll('[data-col-list]'))
      const others = lists.filter(el => !el.hasAttribute('data-later'))
      if (!others.length) { setInnerMax(null); setLaterHidden(0); return }
      const max = Math.max(...others.map(el => el.scrollHeight))
      setInnerMax(max)

      const laterList = row.querySelector('[data-later]')
      if (!laterList) { setLaterHidden(0); return }
      const barSpace = 22 // room the "+N more" footer overlaps
      const listTop = laterList.getBoundingClientRect().top
      let hidden = 0
      for (const item of laterList.querySelectorAll('[data-task-item]')) {
        const relBottom = item.getBoundingClientRect().bottom - listTop
        if (relBottom > max - barSpace) hidden++
      }
      setLaterHidden(hidden)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(row)
    row.querySelectorAll('[data-col-list]').forEach(el => ro.observe(el))
    return () => ro.disconnect()
  }, [measureSig])

  if (loading) return null

  // Combine standard tasks (includes weekly instances) + monthly instances for timeline display
  const allTasks = [...standardTasks, ...monthlyInstances]

  // Filter by selected team member
  const filteredTasks = !activeFilter
    ? allTasks
    : allTasks.filter(task => {
        if (activeFilter === currentUserId) {
          // Current user: show their own tasks (unassigned or explicitly assigned to them)
          return task.assignees.length === 0 || task.assignees.includes(activeFilter)
        }
        return task.assignees.includes(activeFilter)
      })

  const { overdue, dayColumns, nextWeek, later } = buildWeekColumns(filteredTasks, hideCompleted)
  const hasAnything =
    overdue.tasks.length > 0 ||
    dayColumns.some(c => c.tasks.length > 0) ||
    nextWeek.tasks.length > 0 ||
    later.tasks.length > 0

  const sortedMembers = [...members].sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    return a.display_name.localeCompare(b.display_name)
  })

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">This Week</h2>
          {show && sortedMembers.length > 0 && (
            <select
              value={activeFilter || ''}
              onChange={e => setSelectedMemberId(e.target.value || null)}
              className="text-xs border border-gray-200 dark:border-gray-600 rounded-md px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {sortedMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.display_name}{m.id === currentUserId ? ' (you)' : ''}
                </option>
              ))}
            </select>
          )}
          {show && (
            <label className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="w-3.5 h-3.5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              Hide done
            </label>
          )}
        </div>
        <button
          onClick={() => setShow(v => !v)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
        >
          {show ? 'Hide' : 'Show Timeline'}
        </button>
      </div>

      {show && (
        !hasAnything ? (
          <div className="card text-sm text-gray-400 dark:text-gray-500 text-center py-6">
            No tasks with due dates. Add due dates to tasks to see them here.
          </div>
        ) : (
          <div className="overflow-x-auto pb-1 -mx-1 px-1">
            <div ref={rowRef} className="flex gap-2.5" style={{ minWidth: 'max-content' }}>
              {overdue.tasks.length > 0 && (
                <Column col={overdue} isOverdue onStatusChange={onStatusChange} />
              )}
              {dayColumns.map(col => (
                <Column key={col.key} col={col} onStatusChange={onStatusChange} />
              ))}
              {nextWeek.tasks.length > 0 && (
                <Column col={nextWeek} onStatusChange={onStatusChange} />
              )}
              {later.tasks.length > 0 && (
                <Column col={later} isLater listMaxHeight={innerMax} hiddenCount={laterHidden} onStatusChange={onStatusChange} />
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}
