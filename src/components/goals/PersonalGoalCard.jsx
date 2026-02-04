import { useState } from 'react'
import { useTeam } from '../../contexts/TeamContext'
import Button from '../common/Button'

const statusColors = {
  todo: 'badge-gray',
  in_progress: 'badge-yellow',
  done: 'badge-green'
}

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done'
}

export default function PersonalGoalCard({ goal, onEdit, onDelete, onToggleStatus }) {
  const [expanded, setExpanded] = useState(false)
  const { goals: teamGoals } = useTeam()

  const linkedTasks = goal.linked_tasks || []
  const totalTasks = linkedTasks.length
  const doneTasks = linkedTasks.filter(t => t.status === 'done').length
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Resolve linked team goal names
  const linkedTeamGoals = (goal.linked_goal_ids || [])
    .map(id => (teamGoals || []).find(g => g.id === id))
    .filter(Boolean)

  return (
    <div className={`card ${goal.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${goal.status === 'completed' ? 'line-through' : ''}`}>
              {goal.title}
            </h3>
            <span className={`badge ${goal.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
              {goal.status}
            </span>
          </div>

          {goal.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{goal.description}</p>
          )}

          {/* Linked Team Goals */}
          {linkedTeamGoals.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">Team goals:</span>
              <div className="flex flex-wrap gap-1">
                {linkedTeamGoals.map(tg => (
                  <span key={tg.id} className="badge badge-blue text-xs">{tg.title}</span>
                ))}
              </div>
            </div>
          )}

          {/* Task Progress Bar */}
          {totalTasks > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {doneTasks}/{totalTasks} tasks done
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${progressPercent === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="small"
            onClick={() => onToggleStatus(goal)}
          >
            {goal.status === 'active' ? 'Complete' : 'Reopen'}
          </Button>
          <Button variant="ghost" size="small" onClick={() => onEdit(goal)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => onDelete(goal.id)}
            className="text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Linked Tasks */}
      {linkedTasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            onClick={() => setExpanded(!expanded)}
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{linkedTasks.length} linked tasks</span>
          </button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {linkedTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                  >
                    <span className={`badge ${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
                    <span className="flex-1 font-medium">{task.title}</span>
                    {task.due_date && (
                      <span className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isOverdue ? 'Overdue: ' : 'Due: '}
                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
