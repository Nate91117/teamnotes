import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'

// Convert YYYY-MM-DD to ISO string at noon UTC (date stays same in any US timezone)
function dateToNoonUTC(dateStr) {
  if (!dateStr) return null
  return `${dateStr}T12:00:00.000Z`
}

export default function AddGoalTaskModal({ isOpen, onClose, goal, members = [], onCreate }) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('todo')
  const [dueDate, setDueDate] = useState('')
  const [assignees, setAssignees] = useState([])
  const [saving, setSaving] = useState(false)

  // Reset fields whenever the modal opens for a (new) goal
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setStatus('todo')
      setDueDate('')
      setAssignees([])
      setSaving(false)
    }
  }, [isOpen, goal?.id])

  function toggleAssignee(id) {
    setAssignees(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  async function handleCreate() {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      await onCreate({
        title: title.trim(),
        status,
        due_date: dateToNoonUTC(dueDate),
        assignees
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!goal) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add task to "${goal.title}"`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving || !title.trim()}>
            {saving ? 'Adding...' : 'Add task'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input w-full"
          placeholder="Task title"
          autoFocus
        />
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input flex-1"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="done">Done</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input flex-1"
          />
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Assignees:</span>
          <div className="flex flex-wrap gap-1">
            {members.map(member => (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleAssignee(member.id)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  assignees.includes(member.id)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                }`}
              >
                {member.display_name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
