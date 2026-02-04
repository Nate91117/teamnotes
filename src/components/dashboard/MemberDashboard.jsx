import { Link } from 'react-router-dom'
import { useTeam } from '../../contexts/TeamContext'
import { useNotes } from '../../hooks/useNotes'
import { useTasks } from '../../hooks/useTasks'
import GoalCard from './GoalCard'
import LoadingSpinner from '../common/LoadingSpinner'

export default function MemberDashboard() {
  const { goals, loading: goalsLoading } = useTeam()
  const { notes, loading: notesLoading } = useNotes()
  const { tasks, todoTasks, inProgressTasks, loading: tasksLoading } = useTasks()

  const loading = goalsLoading || notesLoading || tasksLoading

  const activeGoals = goals.filter(g => g.status === 'active')
  const recentNotes = notes.slice(0, 3)
  const activeTasks = [...todoTasks, ...inProgressTasks].slice(0, 5)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-3xl font-bold text-primary-600">{notes.length}</div>
          <div className="text-gray-600 dark:text-gray-400">My Notes</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-yellow-600">{todoTasks.length + inProgressTasks.length}</div>
          <div className="text-gray-600 dark:text-gray-400">Active Tasks</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-green-600">{activeGoals.length}</div>
          <div className="text-gray-600 dark:text-gray-400">Team Goals</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Notes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notes</h3>
            <Link to="/notes" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <div className="card text-center text-gray-500 dark:text-gray-400 py-6">
              No notes yet. <Link to="/notes" className="text-primary-600">Create one</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map(note => (
                <div key={note.id} className="card py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{note.title}</h4>
                    {note.goals && (
                      <span className="badge badge-blue text-xs">
                        {note.goals.title}
                      </span>
                    )}
                    {note.shared_to_dashboard && (
                      <span className="badge badge-green text-xs">Shared</span>
                    )}
                  </div>
                  {note.content && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{note.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Tasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Tasks</h3>
            <Link to="/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>
          {activeTasks.length === 0 ? (
            <div className="card text-center text-gray-500 dark:text-gray-400 py-6">
              No active tasks. <Link to="/tasks" className="text-primary-600">Create one</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(task => (
                <div key={task.id} className="card py-4">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${task.status === 'in_progress' ? 'badge-yellow' : 'badge-gray'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                    {task.goals && (
                      <span className="badge badge-blue text-xs ml-auto">
                        {task.goals.title}
                      </span>
                    )}
                  </div>
                  {task.due_date && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Team Goals */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Goals</h3>
        {activeGoals.length === 0 ? (
          <div className="card text-center text-gray-500 dark:text-gray-400 py-8">
            No active team goals yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isLeader={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
