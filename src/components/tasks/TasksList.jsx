import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useTeam } from '../../contexts/TeamContext'
import TaskCard from './TaskCard'
import TaskEditor from './TaskEditor'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  done: 'Done'
}

export default function TasksList() {
  const { tasks, standardTasks, weeklyTemplates, monthlyTemplates, loading, createTask, updateTask, deleteTask, reorderTasks } = useTasks()
  const { members } = useTeam()
  const [showEditor, setShowEditor] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showRankControls] = useState(true)
  const [hideCompleted, setHideCompleted] = useState(true)
  const [taskMode, setTaskMode] = useState('standard') // 'standard' | 'weekly' | 'monthly'

  function openCreate() {
    setEditingTask(null)
    setShowEditor(true)
  }

  function openEdit(task) {
    setEditingTask(task)
    setShowEditor(true)
  }

  async function handleSave(data) {
    if (editingTask) {
      await updateTask(editingTask.id, data)
    } else {
      if (taskMode === 'monthly') data.is_monthly = true
      if (taskMode === 'weekly') data.is_weekly = true
      await createTask(data)
    }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id)
    }
  }

  async function handleStatusChange(id, status) {
    await updateTask(id, { status })
  }

  async function handleToggleShare(task) {
    await updateTask(task.id, { shared_to_dashboard: !task.shared_to_dashboard })
  }

  async function handleMoveUpAll(index) {
    if (index === 0) return
    const sortedTasks = [...tasks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    ;[sortedTasks[index - 1], sortedTasks[index]] = [sortedTasks[index], sortedTasks[index - 1]]
    await reorderTasks(sortedTasks)
  }

  async function handleMoveDownAll(index) {
    const sortedTasks = [...tasks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    if (index === sortedTasks.length - 1) return
    ;[sortedTasks[index], sortedTasks[index + 1]] = [sortedTasks[index + 1], sortedTasks[index]]
    await reorderTasks(sortedTasks)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  function sortByDueDate(a, b) {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  }

  const activeTasks =
    taskMode === 'monthly' ? monthlyTemplates :
    taskMode === 'weekly' ? weeklyTemplates :
    standardTasks

  const visibleTasks = hideCompleted ? activeTasks.filter(t => t.status !== 'done') : activeTasks
  const sortedTasks = [...visibleTasks].sort(sortByDueDate)
  const totalCount = activeTasks.length
  const hiddenCount = activeTasks.length - visibleTasks.length

  const modeLabel =
    taskMode === 'monthly' ? 'Monthly ' :
    taskMode === 'weekly' ? 'Weekly ' :
    ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {totalCount} tasks{hiddenCount > 0 ? ` (${hiddenCount} completed hidden)` : ''}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Task mode toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTaskMode('standard')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                taskMode === 'standard' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setTaskMode('weekly')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                taskMode === 'weekly' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTaskMode('monthly')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                taskMode === 'monthly' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Monthly
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            Hide completed
          </label>
          <Button onClick={openCreate}>
            + New {modeLabel}Task
          </Button>
        </div>
      </div>

      {activeTasks.length === 0 ? (
        <div className="card text-center text-gray-500 dark:text-gray-400 py-12">
          <p className="mb-4">
            {taskMode === 'monthly'
              ? 'No monthly tasks yet. Monthly tasks auto-create a new copy each month.'
              : taskMode === 'weekly'
              ? 'No weekly tasks yet. Weekly tasks auto-create a copy each week on the selected day.'
              : 'No tasks yet. Create your first task!'
            }
          </p>
          <Button onClick={openCreate}>+ New {modeLabel}Task</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onToggleShare={handleToggleShare}
              showRankControls={showRankControls}
              onMoveUp={() => handleMoveUpAll(index)}
              onMoveDown={() => handleMoveDownAll(index)}
              isFirst={index === 0}
              isLast={index === sortedTasks.length - 1}
              members={members}
              showMonthlyBadge={taskMode === 'monthly'}
            />
          ))}
        </div>
      )}

      <TaskEditor
        task={editingTask}
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleSave}
        isMonthlyMode={taskMode === 'monthly'}
        isWeeklyMode={taskMode === 'weekly'}
      />
    </div>
  )
}
