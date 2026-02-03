import { useState } from 'react'
import { useTeam } from '../../contexts/TeamContext'
import { useAuth } from '../../contexts/AuthContext'
import MemberList from './MemberList'
import InviteMember from './InviteMember'
import Button from '../common/Button'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'

export default function TeamSettingsComponent() {
  const { teams, currentTeam, selectTeam, createTeam, isLeader, loading } = useTeam()
  const { profile, updateProfile } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)

  async function handleCreateTeam(e) {
    e.preventDefault()
    if (!teamName.trim()) return

    setSaving(true)
    await createTeam(teamName.trim())
    setTeamName('')
    setShowCreateModal(false)
    setSaving(false)
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    if (!displayName.trim()) return

    setSaving(true)
    await updateProfile({ display_name: displayName.trim() })
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Profile</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              className="input bg-gray-50"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
              placeholder="Your name..."
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Update Profile'}
          </Button>
        </form>
      </section>

      {/* Team Selection */}
      {teams.length > 0 && (
        <section className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Teams</h2>
          <div className="space-y-2">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => selectTeam(team)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  currentTeam?.id === team.id
                    ? 'bg-primary-50 border-2 border-primary-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-700 font-medium text-sm">
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{team.name}</span>
                </div>
                <span className={`badge ${team.role === 'leader' ? 'badge-blue' : 'badge-gray'}`}>
                  {team.role}
                </span>
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Team
          </Button>
        </section>
      )}

      {/* No Teams State */}
      {teams.length === 0 && (
        <section className="card text-center py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Teams Yet</h2>
          <p className="text-gray-600 mb-4">
            Create a team to get started, or wait for an invitation.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Team
          </Button>
        </section>
      )}

      {/* Current Team Settings (Leaders only) */}
      {currentTeam && isLeader && (
        <>
          <InviteMember />

          <section className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Team Members</h2>
            <MemberList />
          </section>
        </>
      )}

      {/* Current Team Members (Members view) */}
      {currentTeam && !isLeader && (
        <section className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Team Members</h2>
          <MemberList />
        </section>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Team"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={saving || !teamName.trim()}>
              {saving ? 'Creating...' : 'Create Team'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTeam}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
        </form>
      </Modal>
    </div>
  )
}
