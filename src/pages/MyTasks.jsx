import { useTeam } from '../contexts/TeamContext'
import Layout from '../components/common/Layout'
import TasksList from '../components/tasks/TasksList'
import { Link } from 'react-router-dom'

export default function MyTasks() {
  const { currentTeam } = useTeam()

  if (!currentTeam) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Team Selected</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be part of a team to create tasks.
          </p>
          <Link to="/team" className="text-primary-600 hover:text-primary-700 font-medium">
            Go to Team Settings
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <TasksList />
    </Layout>
  )
}
