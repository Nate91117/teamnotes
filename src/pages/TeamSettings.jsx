import { Navigate } from 'react-router-dom'
import { useTeam } from '../contexts/TeamContext'
import Layout from '../components/common/Layout'
import TeamSettingsComponent from '../components/team/TeamSettings'

export default function TeamSettings() {
  const { isLeader } = useTeam()

  if (!isLeader) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Team Settings</h1>
        <TeamSettingsComponent />
      </div>
    </Layout>
  )
}
