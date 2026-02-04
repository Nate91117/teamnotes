import { useState, useEffect } from 'react'
import { useTeam } from '../../contexts/TeamContext'
import Button from '../common/Button'
import Modal from '../common/Modal'

export default function PersonalGoalEditor({ goal, isOpen, onClose, onSave }) {
  const { goals: teamGoals } = useTeam()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [linkedGoalIds, setLinkedGoalIds] = useState([])
  const [saving, setSaving] = useState(false)

  const activeTeamGoals = (teamGoals || []).filter(g => g.status === 'active')

  useEffect(() => {
    if (goal) {
      setTitle(goal.title)
      setDescription(goal.description || '')
      setYear(goal.year)
      setLinkedGoalIds(goal.linked_goal_ids || [])
    } else {
      setTitle('')
      setDescription('')
      setYear(new Date().getFullYear())
      setLinkedGoalIds([])
    }
  }, [goal])

  function toggleGoalLink(goalId) {
    setLinkedGoalIds(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    await onSave({
      title: title.trim(),
      description,
      year,
      linked_goal_ids: linkedGoalIds
    })
    setSaving(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Edit Personal Goal' : 'New Personal Goal'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? 'Saving...' : goal ? 'Save Changes' : 'Create Goal'}
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
            placeholder="Enter goal title..."
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
            placeholder="Add details about this goal..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="input"
            min={2020}
            max={2030}
          />
        </div>

        {activeTeamGoals.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link to Team Goals (optional)
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {activeTeamGoals.map(teamGoal => (
                <button
                  key={teamGoal.id}
                  type="button"
                  onClick={() => toggleGoalLink(teamGoal.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    linkedGoalIds.includes(teamGoal.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  {teamGoal.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
