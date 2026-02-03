import { useState, useEffect } from 'react'
import { useTeam } from '../../contexts/TeamContext'
import Button from '../common/Button'
import Modal from '../common/Modal'

export default function TaskEditor({ task, isOpen, onClose, onSave }) {
  const { goals } = useTeam()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('todo')
  const [linkedGoalId, setLinkedGoalId] = useState('')
  const [sharedToDashboard, setSharedToDashboard] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const activeGoals = (goals || []).filter(g => g.status === 'active')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setNotes(task.notes || '')
      setStatus(task.status)
      setLinkedGoalId(task.linked_goal_id || '')
      setSharedToDashboard(task.shared_to_dashboard || false)
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
    } else {
      setTitle('')
      setDescription('')
      setNotes('')
      setStatus('todo')
      setLinkedGoalId('')
      setSharedToDashboard(false)
      setDueDate('')
    }
  }, [task])

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
      shared_to_dashboard: sharedToDashboard,
      due_date: dueDate ? new Date(dueDate).toISOString() : null
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link to Goal (optional)
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label htmlFor="taskShared" className="text-sm text-gray-700">
            Share to team dashboard
          </label>
        </div>
      </form>
    </Modal>
  )
}
