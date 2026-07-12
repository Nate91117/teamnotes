import { useState } from 'react'
import Button from '../common/Button'

const statusColors = {
  todo: 'badge-gray',
  in_progress: 'badge-yellow',
  on_hold: 'badge-orange',
  done: 'badge-green'
}

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  done: 'Done'
}

// Get date string in Central Time (YYYY-MM-DD format)
function getDateInCentral(date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

function isDateOverdue(dueDateStr) {
  if (!dueDateStr) return false
  const todayStr = getDateInCentral(new Date())
  const dueStr = getDateInCentral(dueDateStr)
  return dueStr < todayStr
}

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  onComplete,
  isLeader,
  linkedItems = [],
  members = [],
  linkedTaskEdit,
  onAddTask
}) {
  const [expanded, setExpanded] = useState(false)
  const [showNotes, setShowNotes] = useState(goal.show_notes || false)

  const linkedNotes = linkedItems.filter(item => item.type === 'note')
  const linkedTasks = linkedItems.filter(item => item.type === 'task')

  // Task progress stats
  const totalTasks = linkedTasks.length
  const doneTasks = linkedTasks.filter(t => t.status === 'done').length
  const inProgressTasks = linkedTasks.filter(t => t.status === 'in_progress').length
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Get assigned member names
  const assignedMemberNames = (goal.assigned_members || [])
    .map(userId => members.find(m => m.id === userId)?.display_name)
    .filter(Boolean)

  const formattedDueDate = goal.due_date
    ? new Date(goal.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/Chicago'
      })
    : null

  const isOverdue = goal.due_date && isDateOverdue(goal.due_date) && goal.status !== 'completed'

  return (
    <div className="card group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
          {formattedDueDate && (
            <span className={`badge ${isOverdue ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'badge-blue'}`}>
              {isOverdue ? 'Overdue: ' : 'Due: '}{formattedDueDate}
            </span>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {onComplete && goal.status !== 'completed' && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => onComplete(goal.id)}
              title="Mark complete"
            >
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          )}
          {isLeader && (
            <>
              <Button
                variant="ghost"
                size="small"
                onClick={() => onEdit(goal)}
                title="Edit goal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => onDelete(goal.id)}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                title="Delete goal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </>
          )}
        </div>
      </div>

      <div>
        {goal.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{goal.description}</p>
        )}

        {/* Assigned Members */}
        {assignedMemberNames.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Assigned to:</span>
            <div className="flex flex-wrap gap-1">
              {assignedMemberNames.map((name, i) => (
                <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs">
                  {name}
                </span>
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

      {/* Notes Section */}
      {goal.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-2"
            onClick={() => setShowNotes(!showNotes)}
          >
            <svg
              className={`w-4 h-4 transition-transform ${showNotes ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Notes</span>
          </button>
          {showNotes && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {goal.notes}
            </div>
          )}
        </div>
      )}

      {/* Linked Items */}
      {linkedItems.length > 0 && (
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
            <span>{linkedItems.length} linked items</span>
            <span className="text-gray-400">
              ({linkedNotes.length} notes, {linkedTasks.length} tasks)
            </span>
          </button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {linkedItems.map(item => {
                const isDone = item.type === 'task' && item.status === 'done'
                const isTask = item.type === 'task'
                const dateLabel = isTask
                  ? isDone && item.completed_at
                    ? `Completed: ${new Date(item.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' })}`
                    : item.due_date
                    ? `Due: ${new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' })}`
                    : null
                  : null

                // Inline editing for this linked task
                if (isTask && linkedTaskEdit?.editingTask?.id === item.id) {
                  const assigneeNames = (item.assignees || [])
                    .map(uid => members.find(m => m.id === uid)?.display_name)
                    .filter(Boolean)

                  return (
                    <div key={`${item.type}-${item.id}`} className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={linkedTaskEdit.editTitle}
                          onChange={(e) => linkedTaskEdit.setEditTitle(e.target.value)}
                          className="input text-sm w-full"
                          placeholder="Task title"
                        />
                        <div className="flex gap-2">
                          <select
                            value={linkedTaskEdit.editStatus}
                            onChange={(e) => linkedTaskEdit.setEditStatus(e.target.value)}
                            className="input text-sm flex-1"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="on_hold">On Hold</option>
                            <option value="done">Done</option>
                          </select>
                          <input
                            type="date"
                            value={linkedTaskEdit.editDueDate}
                            onChange={(e) => linkedTaskEdit.setEditDueDate(e.target.value)}
                            className="input text-sm flex-1"
                          />
                        </div>
                        {/* Assignee multi-select pills */}
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Assignees:</span>
                          <div className="flex flex-wrap gap-1">
                            {members.map(member => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => linkedTaskEdit.toggleAssignee(member.id)}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                  linkedTaskEdit.editAssignees.includes(member.id)
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                }`}
                              >
                                {member.display_name}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="secondary" size="small" onClick={linkedTaskEdit.cancelEdit} disabled={linkedTaskEdit.saving}>
                            Cancel
                          </Button>
                          <Button size="small" onClick={linkedTaskEdit.saveEdit} disabled={linkedTaskEdit.saving || !linkedTaskEdit.editTitle.trim()}>
                            {linkedTaskEdit.saving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }

                // Get assignee display names for this item
                const itemAssigneeNames = isTask
                  ? (item.assignees || [])
                      .map(uid => members.find(m => m.id === uid)?.display_name)
                      .filter(Boolean)
                  : []

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm ${isDone ? 'opacity-60' : ''} ${isTask && isLeader ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors' : ''}`}
                    onClick={isTask && isLeader && linkedTaskEdit ? () => linkedTaskEdit.openEdit(item) : undefined}
                  >
                    {/* Row 1: type badge + truncated title + status badge */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`badge flex-shrink-0 ${item.type === 'note' ? 'badge-blue' : 'badge-yellow'}`}>
                        {item.type}
                      </span>
                      <span className={`flex-1 font-medium truncate ${isDone ? 'line-through' : ''}`}>{item.title}</span>
                      {isTask && item.status && (
                        <span className={`badge flex-shrink-0 ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                      )}
                    </div>
                    {/* Row 2: date + assignees + author (indented, smaller text) */}
                    <div className="flex items-center gap-2 mt-1 pl-14">
                      {dateLabel && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{dateLabel}</span>
                      )}
                      {itemAssigneeNames.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {itemAssigneeNames.map((name, i) => (
                            <span key={i} className="px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">by {item.author}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add task to this goal */}
      {onAddTask && (
        <button
          onClick={() => onAddTask(goal)}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
      )}
    </div>
  )
}
