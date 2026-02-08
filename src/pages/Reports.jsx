import { useTeam } from '../contexts/TeamContext'
import Layout from '../components/common/Layout'
import ReportsDashboard from '../components/dashboard/ReportsDashboard'
import { Link } from 'react-router-dom'

export default function Reports() {
  const { currentTeam, members, isLeader } = useTeam()

  if (!currentTeam) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Team Selected</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be part of a team to view reports.
          </p>
          <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
            Go to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  if (!isLeader) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Leader Only</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Reports are only available to team leaders.
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Assign and track reports by team member
        </p>
      </div>
      <ReportsDashboard members={members} />
    </Layout>
  )
}
