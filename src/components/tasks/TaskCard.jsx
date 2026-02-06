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

// Get date string in Central Time (YYYY-MM-DD format)
function getDateInCentral(date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

function getDaysUntilDue(dueDateStr) {
  if (!dueDateStr) return null
  const todayStr = getDateInCentral(new Date())
  const dueStr = getDateInCentral(dueDateStr)
  const today = new Date(todayStr)
  const due = new Date(dueStr)
  const diffMs = due - today
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return diffDays
}

function isDateOverdue(dueDateStr) {
  if (!dueDateStr) return false
  const todayStr = getDateInCentral(new Date())
  const dueStr = getDateInCentral(dueDateStr)
  return dueStr < todayStr
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, onToggleShare, onMoveUp, onMoveDown, isFirst, isLast, showRankControls = false, hideNotes = false, members = [] }) {
  const formattedDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Chicago'
      })
    : null

  const isOverdue = task.due_date && isDateOverdue(task.due_date) && task.status !== 'done'
  const daysUntilDue = getDaysUntilDue(task.due_date)

  // Get assignee names
  const assigneeNames = (task.assignees || [])
    .map(uid => {
      const member = members.find(m => m.id === uid)
      return member?.display_name
    })
    .filter(Boolean)

  let daysLabel = null
  if (daysUntilDue !== null && task.status !== 'done') {
    if (daysUntilDue < 0) {
      daysLabel = `(${Math.abs(daysUntilDue)} days overdue)`
    } else if (daysUntilDue === 0) {
      daysLabel = '(due today)'
    } else {
      daysLabel = `(${daysUntilDue} days)`
    }
  }

  return (
    <div className={`card group hover:shadow-md transition-shadow ${task.status === 'done' ? 'opacity-60' : ''}`}>
      <div className="flex gap-4">
        {/* Left side: main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge ${statusColors[task.status]}`}>
                  {statusLabels[task.status]}
                </span>
                <h3 className={`font-semibold text-gray-900 dark:text-white ${task.status === 'done' ? 'line-through' : ''}`}>
                  {task.title}
                </h3>
                {task.goals && (
                  <span className="badge badge-blue">{task.goals.title}</span>
                )}
                {task.shared_to_dashboard && (
                  <span className="badge badge-green">Shared</span>
                )}
              </div>
              {formattedDate && (
                <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {isOverdue ? 'Overdue: ' : 'Due: '}{formattedDate}
                  {daysLabel && <span className="ml-1">{daysLabel}</span>}
                </p>
              )}
              {/* Assignee badges */}
              {assigneeNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {assigneeNames.map((name, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Rank controls */}
              {showRankControls && (
                <div className="flex flex-col mr-2">
                  <button
                    onClick={onMoveUp}
                    disabled={isFirst}
                    className={`p-1 ${isFirst ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={onMoveDown}
                    disabled={isLast}
                    className={`p-1 ${isLast ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => onToggleShare(task)}
                  title={task.shared_to_dashboard ? 'Unshare from dashboard' : 'Share to dashboard'}
                >
                  {task.shared_to_dashboard ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  )}
                </Button>
                <Button variant="ghost" size="small" onClick={() => onEdit(task)}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => onDelete(task.id)}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {task.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{task.description}</p>
          )}

          {/* Quick status change buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {task.status !== 'todo' && (
              <button
                onClick={() => onStatusChange(task.id, 'todo')}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Mark To Do
              </button>
            )}
            {task.status !== 'in_progress' && (
              <button
                onClick={() => onStatusChange(task.id, 'in_progress')}
                className="text-xs text-yellow-600 hover:text-yellow-700"
              >
                Start Working
              </button>
            )}
            {task.status !== 'done' && (
              <button
                onClick={() => onStatusChange(task.id, 'done')}
                className="text-xs text-green-600 hover:text-green-700"
              >
                Mark Done
              </button>
            )}
          </div>
        </div>

        {/* Right side: notes */}
        {task.notes && !hideNotes && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap h-full">
              {task.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
