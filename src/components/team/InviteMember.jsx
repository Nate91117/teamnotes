import { useState } from 'react'
import { useTeam } from '../../contexts/TeamContext'
import Button from '../common/Button'

export default function InviteMember() {
  const { inviteMember, createPlaceholderMember } = useTeam()

  // Email invite state
  const [email, setEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState(null)
  const [inviteError, setInviteError] = useState(null)

  // Create member state
  const [displayName, setDisplayName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createMessage, setCreateMessage] = useState(null)
  const [createError, setCreateError] = useState(null)

  async function handleInvite(e) {
    e.preventDefault()
    if (!email.trim()) return

    setInviteLoading(true)
    setInviteMessage(null)
    setInviteError(null)

    const { error } = await inviteMember(email.trim())

    if (error) {
      setInviteError(error.message)
    } else {
      setInviteMessage(`Invitation sent to ${email}`)
      setEmail('')
    }

    setInviteLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!displayName.trim()) return

    setCreateLoading(true)
    setCreateMessage(null)
    setCreateError(null)

    const { error } = await createPlaceholderMember(displayName.trim())

    if (error) {
      setCreateError(error.message || 'Failed to create member')
    } else {
      setCreateMessage(`Created member "${displayName}"`)
      setDisplayName('')
    }

    setCreateLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Create Member (placeholder) */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Member</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input flex-1"
              placeholder="Enter display name..."
              required
            />
            <Button type="submit" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>

          {createError && (
            <div className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg text-sm">
              {createError}
            </div>
          )}

          {createMessage && (
            <div className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 p-3 rounded-lg text-sm">
              {createMessage}
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Creates a placeholder member for task assignment. They won't be able to log in.
          </p>
        </form>
      </div>

      {/* Email Invite */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite by Email</h3>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input flex-1"
              placeholder="Enter email address..."
              required
            />
            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? 'Sending...' : 'Invite'}
            </Button>
          </div>

          {inviteError && (
            <div className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg text-sm">
              {inviteError}
            </div>
          )}

          {inviteMessage && (
            <div className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 p-3 rounded-lg text-sm">
              {inviteMessage}
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400">
            When this person signs up with this email address, they'll automatically be added to your team.
          </p>
        </form>
      </div>
    </div>
  )
}
