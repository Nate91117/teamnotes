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

export default function MemberViewDashboard({ members, memberTasks, memberNotes }) {
  if (!members || members.length === 0) {
    return (
      <div className="card text-center text-gray-500 dark:text-gray-400 py-8">
        No team members yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {members.map(member => {
        const tasks = memberTasks[member.id] || []
        const notes = memberNotes[member.id] || []
        const hasItems = tasks.length > 0 || notes.length > 0

        return (
          <div key={member.id} className="card">
            {/* Member Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                  {member.display_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{member.display_name}</h3>
                <span className={`badge text-xs ${member.role === 'leader' ? 'badge-blue' : 'badge-gray'}`}>
                  {member.role}
                </span>
              </div>
            </div>

            {!hasItems ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No shared items yet
              </p>
            ) : (
              <div className="space-y-4">
                {/* Tasks */}
                {tasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Tasks ({tasks.length})
                    </h4>
                    <div className="space-y-2">
                      {tasks.map(task => {
                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                        return (
                          <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                            <span className={`badge ${statusColors[task.status]}`}>
                              {statusLabels[task.status]}
                            </span>
                            <span className="flex-1 font-medium text-gray-900 dark:text-white">{task.title}</span>
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
                  </div>
                )}

                {/* Notes */}
                {notes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Notes ({notes.length})
                    </h4>
                    <div className="space-y-2">
                      {notes.map(note => (
                        <div key={note.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{note.title}</div>
                          {note.content && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{note.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
