import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function dateToInput(dateStr) {
  if (!dateStr) return ''
  // DATE columns come back as YYYY-MM-DD — return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

export default function TodoEditor({ item, isOpen, onClose, lists, onSave }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [listId, setListId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [recurType, setRecurType] = useState('none') // 'none' | 'weekly' | 'monthly'
  const [weeklyDay, setWeeklyDay] = useState(1) // Monday default
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setTitle(item.title || '')
        setDescription(item.description || '')
        setListId(item.list_id || '')
        setDueDate(dateToInput(item.due_date))
        if (item.is_weekly) {
          setRecurType('weekly')
          setWeeklyDay(item.weekly_day ?? 1)
        } else if (item.is_monthly) {
          setRecurType('monthly')
        } else {
          setRecurType('none')
        }
      } else {
        setTitle('')
        setDescription('')
        setListId('')
        setDueDate('')
        setRecurType('none')
        setWeeklyDay(1)
      }
      setError('')
    }
  }, [isOpen, item])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        list_id: listId || null,
        due_date: recurType === 'none' ? (dueDate || null) : null,
        is_weekly: recurType === 'weekly',
        weekly_day: recurType === 'weekly' ? weeklyDay : null,
        is_monthly: recurType === 'monthly'
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit To-Do' : 'New To-Do'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? 'Saving...' : item ? 'Save Changes' : 'Add To-Do'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            className="input"
            placeholder="What needs to be done?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (optional)
          </label>
          <textarea
            className="input min-h-[60px]"
            placeholder="Add notes..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              List
            </label>
            <select
              className="input"
              value={listId}
              onChange={e => setListId(e.target.value)}
            >
              <option value="">— No list —</option>
              {lists.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              disabled={recurType !== 'none'}
              title={recurType !== 'none' ? 'Due date is set automatically for recurring tasks' : ''}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recurrence
          </label>
          <div className="flex gap-2">
            {[
              { value: 'none', label: 'None' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRecurType(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  recurType === opt.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {recurType === 'weekly' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of week
              </label>
              <select
                className="input"
                value={weeklyDay}
                onChange={e => setWeeklyDay(Number(e.target.value))}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                An instance will be created each week for the selected day.
              </p>
            </div>
          )}

          {recurType === 'monthly' && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              A new copy of this task will be created each month.
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}
