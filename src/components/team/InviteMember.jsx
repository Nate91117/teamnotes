import { useState } from 'react'
import { useTeam } from '../../contexts/TeamContext'
import Button from '../common/Button'

export default function InviteMember() {
  const { inviteMember } = useTeam()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setMessage(null)
    setError(null)

    const { error } = await inviteMember(email.trim())

    if (error) {
      setError(error.message)
    } else {
      setMessage(`Invitation sent to ${email}`)
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite Member</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input flex-1"
            placeholder="Enter email address..."
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Invite'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 p-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400">
          When this person signs up with this email address, they'll automatically be added to your team.
        </p>
      </form>
    </div>
  )
}
