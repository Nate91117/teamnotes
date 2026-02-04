import { useTeam } from '../contexts/TeamContext'
import Layout from '../components/common/Layout'
import PersonalGoalsList from '../components/goals/PersonalGoalsList'
import { Link } from 'react-router-dom'

export default function PersonalGoals() {
  const { currentTeam } = useTeam()

  if (!currentTeam) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Team Selected</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be part of a team to create personal goals.
          </p>
          <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
            Go to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PersonalGoalsList />
    </Layout>
  )
}
