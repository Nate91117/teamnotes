import { useState } from 'react'
import Button from '../common/Button'

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  isLeader,
  linkedItems = [],
  members = []
}) {
  const [expanded, setExpanded] = useState(false)
  const [showNotes, setShowNotes] = useState(goal.show_notes || false)

  const linkedNotes = linkedItems.filter(item => item.type === 'note')
  const linkedTasks = linkedItems.filter(item => item.type === 'task')

  // Get assigned member names
  const assignedMemberNames = (goal.assigned_members || [])
    .map(userId => members.find(m => m.id === userId)?.display_name)
    .filter(Boolean)

  const formattedDueDate = goal.due_date
    ? new Date(goal.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null

  const isOverdue = goal.due_date && new Date(goal.due_date) < new Date() && goal.status !== 'completed'

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
            <span className={`badge ${goal.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
              {goal.status}
            </span>
            {formattedDueDate && (
              <span className={`badge ${isOverdue ? 'bg-red-100 text-red-800' : 'badge-blue'}`}>
                {isOverdue ? 'Overdue: ' : 'Due: '}{formattedDueDate}
              </span>
            )}
          </div>

          {goal.description && (
            <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
          )}

          {/* Assigned Members */}
          {assignedMemberNames.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Assigned to:</span>
              <div className="flex flex-wrap gap-1">
                {assignedMemberNames.map((name, i) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isLeader && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="small"
                onClick={() => onEdit(goal)}
              >
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
          )}
        </div>
      </div>

      {/* Notes Section */}
      {goal.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
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
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
              {goal.notes}
            </div>
          )}
        </div>
      )}

      {/* Linked Items */}
      {linkedItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
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
              {linkedItems.map(item => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <span className={`badge ${item.type === 'note' ? 'badge-blue' : 'badge-yellow'}`}>
                    {item.type}
                  </span>
                  <span className="flex-1 font-medium">{item.title}</span>
                  <span className="text-gray-500">by {item.author}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
