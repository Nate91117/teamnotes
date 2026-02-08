import { useState, useEffect } from 'react'
import { useTeam } from '../../contexts/TeamContext'
import { usePersonalGoals } from '../../hooks/usePersonalGoals'
import Button from '../common/Button'
import Modal from '../common/Modal'

// Get date string in Central Time (YYYY-MM-DD format for input fields)
function getDateInCentral(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

// Convert YYYY-MM-DD to ISO string at noon UTC (so date stays same in any US timezone)
function dateToNoonUTC(dateStr) {
  if (!dateStr) return null
  return `${dateStr}T12:00:00.000Z`
}

export default function TaskEditor({ task, isOpen, onClose, onSave, isMonthlyMode = false }) {
  const { goals, members, isLeader } = useTeam()
  const { activeGoals: activePersonalGoals } = usePersonalGoals()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('todo')
  const [linkedGoalId, setLinkedGoalId] = useState('')
  const [linkedPersonalGoalIds, setLinkedPersonalGoalIds] = useState([])
  const [assigneeIds, setAssigneeIds] = useState([])
  const [sharedToDashboard, setSharedToDashboard] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [isMonthly, setIsMonthly] = useState(false)
  const [saving, setSaving] = useState(false)

  const activeGoals = (goals || []).filter(g => g.status === 'active')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setNotes(task.notes || '')
      setStatus(task.status)
      setLinkedGoalId(task.linked_goal_id || '')
      setLinkedPersonalGoalIds(task.linked_personal_goal_ids || [])
      setAssigneeIds(task.assignees || [])
      setSharedToDashboard(task.shared_to_dashboard || false)
      setDueDate(getDateInCentral(task.due_date))
      setIsMonthly(task.is_monthly || false)
    } else {
      setTitle('')
      setDescription('')
      setNotes('')
      setStatus('todo')
      setLinkedGoalId('')
      setLinkedPersonalGoalIds([])
      setAssigneeIds([])
      setSharedToDashboard(false)
      setDueDate('')
      setIsMonthly(isMonthlyMode)
    }
  }, [task])

  function togglePersonalGoal(pgId) {
    setLinkedPersonalGoalIds(prev =>
      prev.includes(pgId)
        ? prev.filter(id => id !== pgId)
        : [...prev, pgId]
    )
  }

  function toggleAssignee(memberId) {
    setAssigneeIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    await onSave({
      title: title.trim(),
      description,
      notes,
      status,
      linked_goal_id: linkedGoalId || null,
      linked_personal_goal_ids: linkedPersonalGoalIds,
      assignee_ids: assigneeIds,
      shared_to_dashboard: sharedToDashboard,
      due_date: dateToNoonUTC(dueDate),
      is_monthly: isMonthly
    })
    setSaving(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'New Task'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Task title..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[80px]"
            placeholder="Add details..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Link to Team Goal (optional)
          </label>
          <select
            value={linkedGoalId}
            onChange={(e) => setLinkedGoalId(e.target.value)}
            className="input"
          >
            <option value="">No linked goal</option>
            {activeGoals.map(goal => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Link to Personal Goals (optional)
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {(activePersonalGoals || []).length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400 text-sm">No personal goals available</span>
            ) : (
              (activePersonalGoals || []).map(pg => (
                <button
                  key={pg.id}
                  type="button"
                  onClick={() => togglePersonalGoal(pg.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    linkedPersonalGoalIds.includes(pg.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  {pg.title}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Assignees - only visible to leaders */}
        {isLeader && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign to Members
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {(members || []).length === 0 ? (
                <span className="text-gray-500 dark:text-gray-400 text-sm">No team members yet</span>
              ) : (
                (members || []).map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleAssignee(member.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      assigneeIds.includes(member.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {member.display_name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[80px]"
            placeholder="Add notes for this task..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="taskShared"
            checked={sharedToDashboard}
            onChange={(e) => setSharedToDashboard(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <label htmlFor="taskShared" className="text-sm text-gray-700 dark:text-gray-300">
            Share to team dashboard
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="taskMonthly"
            checked={isMonthly}
            onChange={(e) => setIsMonthly(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <label htmlFor="taskMonthly" className="text-sm text-gray-700 dark:text-gray-300">
            Monthly task (auto-creates a copy each month)
          </label>
        </div>
      </form>
    </Modal>
  )
}
