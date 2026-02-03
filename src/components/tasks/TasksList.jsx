import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import TaskCard from './TaskCard'
import TaskEditor from './TaskEditor'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

export default function TasksList() {
  const { tasks, todoTasks, inProgressTasks, doneTasks, loading, createTask, updateTask, deleteTask, reorderTasks } = useTasks()
  const [showEditor, setShowEditor] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [view, setView] = useState('list')
  const [showRankControls, setShowRankControls] = useState(true)

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

  async function handleMoveUp(taskList, index, statusFilter) {
    if (index === 0) return
    const newList = [...taskList]
    ;[newList[index - 1], newList[index]] = [newList[index], newList[index - 1]]

    // Recombine with other status tasks
    const otherTasks = tasks.filter(t => t.status !== statusFilter)
    await reorderTasks([...newList, ...otherTasks])
  }

  async function handleMoveDown(taskList, index, statusFilter) {
    if (index === taskList.length - 1) return
    const newList = [...taskList]
    ;[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]

    // Recombine with other status tasks
    const otherTasks = tasks.filter(t => t.status !== statusFilter)
    await reorderTasks([...newList, ...otherTasks])
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

  const sortedTasks = [...tasks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
          <p className="text-gray-600">{tasks.length} tasks</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'kanban' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
          <Button onClick={openCreate}>
            + New Task
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          <p className="mb-4">No tasks yet. Create your first task!</p>
          <Button onClick={openCreate}>+ New Task</Button>
        </div>
      ) : view === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-700">To Do</h3>
              <span className="badge badge-gray">{todoTasks.length}</span>
            </div>
            <div className="space-y-3">
              {todoTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onToggleShare={handleToggleShare}
                  showRankControls={showRankControls}
                  onMoveUp={() => handleMoveUp(todoTasks, index, 'todo')}
                  onMoveDown={() => handleMoveDown(todoTasks, index, 'todo')}
                  isFirst={index === 0}
                  isLast={index === todoTasks.length - 1}
                />
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-yellow-700">In Progress</h3>
              <span className="badge badge-yellow">{inProgressTasks.length}</span>
            </div>
            <div className="space-y-3">
              {inProgressTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onToggleShare={handleToggleShare}
                  showRankControls={showRankControls}
                  onMoveUp={() => handleMoveUp(inProgressTasks, index, 'in_progress')}
                  onMoveDown={() => handleMoveDown(inProgressTasks, index, 'in_progress')}
                  isFirst={index === 0}
                  isLast={index === inProgressTasks.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-green-700">Done</h3>
              <span className="badge badge-green">{doneTasks.length}</span>
            </div>
            <div className="space-y-3">
              {doneTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onToggleShare={handleToggleShare}
                  showRankControls={showRankControls}
                  onMoveUp={() => handleMoveUp(doneTasks, index, 'done')}
                  onMoveDown={() => handleMoveDown(doneTasks, index, 'done')}
                  isFirst={index === 0}
                  isLast={index === doneTasks.length - 1}
                />
              ))}
            </div>
          </div>
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
            />
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <TaskEditor
        task={editingTask}
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleSave}
      />
    </div>
  )
}
