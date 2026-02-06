import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Button from '../common/Button'

const statusColors = {
  todo: 'badge-gray',
  in_progress: 'badge-yellow',
  done: 'badge-green'
}

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done'
}

// Get date string in Central Time (YYYY-MM-DD format)
function getDateInCentral(date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

function getDaysUntilDue(dueDateStr) {
  if (!dueDateStr) return null
  const todayStr = getDateInCentral(new Date())
  const dueStr = getDateInCentral(dueDateStr)
  const today = new Date(todayStr)
  const due = new Date(dueStr)
  const diffMs = due - today
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return diffDays
}

function isDateOverdue(dueDateStr) {
  if (!dueDateStr) return false
  const todayStr = getDateInCentral(new Date())
  const dueStr = getDateInCentral(dueDateStr)
  return dueStr < todayStr
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' })
}

// Convert YYYY-MM-DD to ISO string at noon UTC (so date stays same in any US timezone)
function dateToNoonUTC(dateStr) {
  if (!dateStr) return null
  return `${dateStr}T12:00:00.000Z`
}

export default function MemberViewDashboard({ members, memberTasks, memberNotes, onTaskUpdate }) {
  const [hideDone, setHideDone] = useState(true)
  const [editingTask, setEditingTask] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStatus, setEditStatus] = useState('todo')
  const [editDueDate, setEditDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  if (!members || members.length === 0) {
    return (
      <div className="card text-center text-gray-500 dark:text-gray-400 py-8">
        No team members yet.
      </div>
    )
  }

  function openInlineEdit(task) {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditStatus(task.status)
    setEditDueDate(getDateInCentral(task.due_date))
  }

  function cancelEdit() {
    setEditingTask(null)
    setEditTitle('')
    setEditStatus('todo')
    setEditDueDate('')
  }

  async function saveInlineEdit() {
    if (!editingTask || !editTitle.trim()) return
    setSaving(true)

    const updates = {
      title: editTitle.trim(),
      status: editStatus,
      due_date: dateToNoonUTC(editDueDate)
    }

    // Handle completed_at
    if (editStatus === 'done' && editingTask.status !== 'done') {
      updates.completed_at = new Date().toISOString()
    } else if (editStatus !== 'done' && editingTask.status === 'done') {
      updates.completed_at = null
    }

    await supabase
      .from('tasks')
      .update(updates)
      .eq('id', editingTask.id)

    setSaving(false)
    setEditingTask(null)
    if (onTaskUpdate) onTaskUpdate()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          Hide completed tasks
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {members.map(member => {
          const allTasks = memberTasks[member.id] || []
          const notes = memberNotes[member.id] || []

          // Sort by due date (soonest first, nulls last)
          function sortByDueDate(a, b) {
            if (!a.due_date && !b.due_date) return 0
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return new Date(a.due_date) - new Date(b.due_date)
          }

          // Separate active and done tasks, sorted by due date
          const activeTasks = allTasks.filter(t => t.status !== 'done').sort(sortByDueDate)
          const doneTasks = allTasks.filter(t => t.status === 'done').sort(sortByDueDate)
          const visibleTasks = hideDone ? activeTasks : [...activeTasks, ...doneTasks]

          const hasItems = allTasks.length > 0 || notes.length > 0

          return (
            <div key={member.id} className="card">
              {/* Member Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                    {member.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{member.display_name}</h3>
                  <span className={`badge text-xs ${member.role === 'leader' ? 'badge-blue' : 'badge-gray'}`}>
                    {member.role}
                  </span>
                </div>
              </div>

              {!hasItems ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No shared items yet
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Tasks */}
                  {visibleTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Tasks ({activeTasks.length} active{!hideDone && doneTasks.length > 0 ? `, ${doneTasks.length} done` : ''})
                      </h4>
                      <div className="space-y-2">
                        {visibleTasks.map(task => {
                          const isDone = task.status === 'done'
                          const isOverdue = task.due_date && isDateOverdue(task.due_date) && !isDone
                          const daysUntilDue = getDaysUntilDue(task.due_date)

                          let daysLabel = null
                          if (daysUntilDue !== null && !isDone) {
                            if (daysUntilDue < 0) {
                              daysLabel = `(${Math.abs(daysUntilDue)}d overdue)`
                            } else if (daysUntilDue === 0) {
                              daysLabel = '(today)'
                            } else {
                              daysLabel = `(${daysUntilDue}d)`
                            }
                          }

                          // Determine which date to show
                          const showDate = isDone && task.completed_at
                            ? `Completed: ${formatDate(task.completed_at)}`
                            : task.due_date
                            ? `${isOverdue ? 'Overdue: ' : 'Due: '}${formatDate(task.due_date)}`
                            : null

                          // Inline editing for this task
                          if (editingTask?.id === task.id) {
                            return (
                              <div key={task.id} className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="input text-sm w-full"
                                    placeholder="Task title"
                                  />
                                  <div className="flex gap-2">
                                    <select
                                      value={editStatus}
                                      onChange={(e) => setEditStatus(e.target.value)}
                                      className="input text-sm flex-1"
                                    >
                                      <option value="todo">To Do</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="done">Done</option>
                                    </select>
                                    <input
                                      type="date"
                                      value={editDueDate}
                                      onChange={(e) => setEditDueDate(e.target.value)}
                                      className="input text-sm flex-1"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="secondary" size="small" onClick={cancelEdit} disabled={saving}>
                                      Cancel
                                    </Button>
                                    <Button size="small" onClick={saveInlineEdit} disabled={saving || !editTitle.trim()}>
                                      {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div
                              key={task.id}
                              className={`flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${isDone ? 'opacity-60' : ''}`}
                              onClick={() => openInlineEdit(task)}
                            >
                              <span className={`badge ${statusColors[task.status]}`}>
                                {statusLabels[task.status]}
                              </span>
                              <span className={`flex-1 font-medium text-gray-900 dark:text-white ${isDone ? 'line-through' : ''}`}>
                                {task.title}
                              </span>
                              <div className="flex flex-col items-end gap-0.5">
                                {showDate && (
                                  <span className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {showDate}
                                    {daysLabel && <span className="ml-1">{daysLabel}</span>}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Hidden done count */}
                  {hideDone && doneTasks.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      + {doneTasks.length} completed task{doneTasks.length !== 1 ? 's' : ''} hidden
                    </p>
                  )}

                  {/* Notes */}
                  {notes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Notes ({notes.length})
                      </h4>
                      <div className="space-y-2">
                        {notes.map(note => (
                          <div key={note.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">{note.title}</div>
                            {note.content && (
                              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{note.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
