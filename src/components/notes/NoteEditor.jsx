import { useState, useEffect } from 'react'
import { useTasks } from '../../hooks/useTasks'
import Button from '../common/Button'
import Modal from '../common/Modal'

export default function NoteEditor({ note, isOpen, onClose, onSave }) {
  const { tasks } = useTasks()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [linkedTaskId, setLinkedTaskId] = useState('')
  const [sharedToDashboard, setSharedToDashboard] = useState(false)
  const [saving, setSaving] = useState(false)

  const activeTasks = tasks.filter(t => t.status !== 'done')

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content || '')
      setLinkedTaskId(note.linked_task_id || '')
      setSharedToDashboard(note.shared_to_dashboard || false)
    } else {
      setTitle('')
      setContent('')
      setLinkedTaskId('')
      setSharedToDashboard(false)
    }
  }, [note])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    await onSave({
      title: title.trim(),
      content,
      linked_task_id: linkedTaskId || null,
      shared_to_dashboard: sharedToDashboard
    })
    setSaving(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={note ? 'Edit Note' : 'New Note'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? 'Saving...' : note ? 'Save Changes' : 'Create Note'}
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
            placeholder="Note title..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input min-h-[150px] font-mono text-sm"
            placeholder="Write your note..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link to Task (optional)
          </label>
          <select
            value={linkedTaskId}
            onChange={(e) => setLinkedTaskId(e.target.value)}
            className="input"
          >
            <option value="">No linked task</option>
            {activeTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="shared"
            checked={sharedToDashboard}
            onChange={(e) => setSharedToDashboard(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <label htmlFor="shared" className="text-sm text-gray-700">
            Share to team dashboard
          </label>
        </div>
      </form>
    </Modal>
  )
}
