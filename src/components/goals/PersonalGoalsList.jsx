import { useState } from 'react'
import { usePersonalGoals } from '../../hooks/usePersonalGoals'
import PersonalGoalCard from './PersonalGoalCard'
import PersonalGoalEditor from './PersonalGoalEditor'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

export default function PersonalGoalsList() {
  const {
    activeGoals,
    completedGoals,
    loading,
    yearFilter,
    setYearFilter,
    createPersonalGoal,
    updatePersonalGoal,
    deletePersonalGoal
  } = usePersonalGoals()
  const [showEditor, setShowEditor] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  function openCreate() {
    setEditingGoal(null)
    setShowEditor(true)
  }

  function openEdit(goal) {
    setEditingGoal(goal)
    setShowEditor(true)
  }

  async function handleSave(data) {
    if (editingGoal) {
      await updatePersonalGoal(editingGoal.id, data)
    } else {
      await createPersonalGoal(data)
    }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this personal goal?')) {
      await deletePersonalGoal(id)
    }
  }

  async function handleToggleStatus(goal) {
    await updatePersonalGoal(goal.id, {
      status: goal.status === 'active' ? 'completed' : 'active'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Goals</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {activeGoals.length} active goals
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="input py-2 px-3 text-sm"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={openCreate}>
            + New Goal
          </Button>
        </div>
      </div>

      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="card text-center text-gray-500 dark:text-gray-400 py-12">
          <p className="mb-4">No personal goals for {yearFilter}. Create your first one!</p>
          <Button onClick={openCreate}>+ New Goal</Button>
        </div>
      ) : (
        <>
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div className="space-y-4 mb-8">
              {activeGoals.map(goal => (
                <PersonalGoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">
                Completed ({completedGoals.length})
              </h3>
              <div className="space-y-4">
                {completedGoals.map(goal => (
                  <PersonalGoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <PersonalGoalEditor
        goal={editingGoal}
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleSave}
      />
    </div>
  )
}
