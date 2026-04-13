import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useTeam } from '../../contexts/TeamContext'
import TaskCard from './TaskCard'
import TaskEditor from './TaskEditor'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

function getTodayCST() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date())
}

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  done: 'Done'
}

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
  done: 'bg-green-100 text-green-800'
}

function buildTimelineBuckets(tasks, hideCompleted) {
  const today = getTodayCST()
  const todayTs = new Date(today + 'T12:00:00').getTime()
  const dayMs = 24 * 60 * 60 * 1000

  // Build individual day buckets for today through +6 days
  const dayBuckets = []
  for (let i = 0; i <= 6; i++) {
    const ts = todayTs + i * dayMs
    const dateObj = new Date(ts)
    const dateStr = dateObj.toLocaleDateString('en-CA', { timeZone: 'UTC' })
    let label
    if (i === 0) label = 'Today'
    else if (i === 1) label = 'Tomorrow'
    else label = dateObj.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' })
    dayBuckets.push({ key: `day-${i}`, label, dateStr, tasks: [] })
  }

  const overdue = { key: 'overdue', label: 'Overdue', tasks: [] }
  const nextWeek = { key: 'next-week', label: 'Next Week', tasks: [] }
  const later = { key: 'later', label: 'Later', tasks: [] }
  const noDueDate = { key: 'no-due-date', label: 'No Due Date', tasks: [] }

  const visible = hideCompleted ? tasks.filter(t => t.status !== 'done') : tasks

  for (const task of visible) {
    if (!task.due_date) {
      noDueDate.tasks.push(task)
      continue
    }
    const taskDateStr = new Date(task.due_date).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
    const taskTs = new Date(taskDateStr + 'T12:00:00').getTime()
    const diffDays = Math.round((taskTs - todayTs) / dayMs)

    if (diffDays < 0) {
      overdue.tasks.push(task)
    } else if (diffDays <= 6) {
      dayBuckets[diffDays].tasks.push(task)
    } else if (diffDays <= 13) {
      nextWeek.tasks.push(task)
    } else {
      later.tasks.push(task)
    }
  }

  return [overdue, ...dayBuckets, nextWeek, later, noDueDate]
}

export default function TasksList() {
  const { tasks, standardTasks, weeklyTemplates, monthlyTemplates, loading, createTask, updateTask, deleteTask, reorderTasks } = useTasks()
  const { members } = useTeam()
  const [showEditor, setShowEditor] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [view, setView] = useState('list')
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
  const visibleTodoTasks = activeTasks.filter(t => t.status === 'todo').sort(sortByDueDate)
  const visibleInProgressTasks = activeTasks.filter(t => t.status === 'in_progress').sort(sortByDueDate)
  const visibleOnHoldTasks = activeTasks.filter(t => t.status === 'on_hold').sort(sortByDueDate)
  const visibleDoneTasks = hideCompleted ? [] : activeTasks.filter(t => t.status === 'done').sort(sortByDueDate)

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
          {/* View toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'kanban' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'timeline' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Timeline
            </button>
          </div>
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
      ) : view === 'timeline' ? (
        /* Timeline View */
        <TimelineView
          tasks={activeTasks}
          hideCompleted={hideCompleted}
          onEdit={openEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      ) : view === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">To Do</h3>
              <span className="badge badge-gray">{visibleTodoTasks.length}</span>
            </div>
            <div className="space-y-3">
              {visibleTodoTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onToggleShare={handleToggleShare}
                  hideNotes={true}
                  members={members}
                  showMonthlyBadge={taskMode === 'monthly'}
                />
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-yellow-700">In Progress</h3>
              <span className="badge badge-yellow">{visibleInProgressTasks.length}</span>
            </div>
            <div className="space-y-3">
              {visibleInProgressTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onToggleShare={handleToggleShare}
                  hideNotes={true}
                  members={members}
                  showMonthlyBadge={taskMode === 'monthly'}
                />
              ))}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-orange-700 dark:text-orange-300">On Hold</h3>
              <span className="badge badge-orange">{visibleOnHoldTasks.length}</span>
            </div>
            <div className="space-y-3">
              {visibleOnHoldTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onToggleShare={handleToggleShare}
                  hideNotes={true}
                  members={members}
                  showMonthlyBadge={taskMode === 'monthly'}
                />
              ))}
            </div>
          </div>

          {!hideCompleted && (
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-green-700">Done</h3>
                <span className="badge badge-green">{visibleDoneTasks.length}</span>
              </div>
              <div className="space-y-3">
                {visibleDoneTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onToggleShare={handleToggleShare}
                    hideNotes={true}
                    members={members}
                    showMonthlyBadge={taskMode === 'monthly'}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
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

function TimelineView({ tasks, hideCompleted, onEdit, onDelete, onStatusChange }) {
  const buckets = buildTimelineBuckets(tasks, hideCompleted)
  const nonEmpty = buckets.filter(b => b.tasks.length > 0)

  if (nonEmpty.length === 0) {
    return (
      <div className="card text-center text-gray-500 dark:text-gray-400 py-12">
        No tasks to show in the timeline.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {nonEmpty.map(bucket => (
        <div key={bucket.key} className="card">
          <div className="flex items-center gap-2 mb-3">
            <h3 className={`font-semibold text-sm ${
              bucket.key === 'overdue' ? 'text-red-600 dark:text-red-400' :
              bucket.key === 'day-0' ? 'text-primary-600 dark:text-primary-400' :
              'text-gray-700 dark:text-gray-300'
            }`}>
              {bucket.label}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              bucket.key === 'overdue' ? 'bg-red-100 text-red-700' :
              bucket.key === 'day-0' ? 'bg-primary-100 text-primary-700' :
              'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {bucket.tasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {bucket.tasks.map(task => (
              <TimelineTaskRow
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TimelineTaskRow({ task, onEdit, onDelete, onStatusChange }) {
  const isDone = task.status === 'done'

  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group">
      <input
        type="checkbox"
        checked={isDone}
        onChange={() => onStatusChange(task.id, isDone ? 'todo' : 'done')}
        className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 flex-shrink-0 cursor-pointer"
      />
      <span className={`flex-1 text-sm ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
        {task.title}
      </span>
      {!isDone && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[task.status] || STATUS_COLORS.todo}`}>
          {STATUS_LABELS[task.status] || task.status}
        </span>
      )}
      <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 px-1.5 py-0.5 rounded"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 px-1.5 py-0.5 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
