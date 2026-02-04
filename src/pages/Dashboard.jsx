import { useTeam } from '../contexts/TeamContext'
import Layout from '../components/common/Layout'
import LeaderDashboard from '../components/dashboard/LeaderDashboard'
import MemberDashboard from '../components/dashboard/MemberDashboard'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useState } from 'react'
import Modal from '../components/common/Modal'

export default function Dashboard() {
  const { currentTeam, isLeader, loading, createTeam, teams } = useTeam()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreateTeam(e) {
    e.preventDefault()
    if (!teamName.trim()) return

    setCreating(true)
    setError(null)

    const result = await createTeam(teamName.trim())

    if (result.error) {
      console.error('Create team error:', result.error)
      setError(result.error.message || 'Failed to create team')
      setCreating(false)
    } else {
      setTeamName('')
      setShowCreateModal(false)
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    )
  }

  // No team yet
  if (!currentTeam) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-16">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to TeamNotes</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create a team to get started, or wait for an invitation to join an existing team.
            </p>
          </div>

          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Team
          </Button>

          <Modal
            isOpen={showCreateModal}
            onClose={() => { setShowCreateModal(false); setError(null); }}
            title="Create New Team"
            footer={
              <>
                <Button variant="secondary" onClick={() => { setShowCreateModal(false); setError(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam} disabled={creating || !teamName.trim()}>
                  {creating ? 'Creating...' : 'Create Team'}
                </Button>
              </>
            }
          >
            <form onSubmit={handleCreateTeam}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="input"
                  placeholder="Enter team name..."
                  required
                />
              </div>
              {error && (
                <div className="mt-3 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </form>
          </Modal>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {isLeader ? <LeaderDashboard /> : <MemberDashboard />}
    </Layout>
  )
}
