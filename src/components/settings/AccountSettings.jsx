import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../common/Button'

export default function AccountSettings() {
  const { profile, updateProfile, updateEmail } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [email, setEmail] = useState(profile?.email || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const errors = []

    // Update display name if changed
    if (displayName !== profile.display_name) {
      const { error } = await updateProfile({ display_name: displayName })
      if (error) errors.push('Failed to update display name')
    }

    // Update email if changed
    if (email !== profile.email) {
      const { error } = await updateEmail(email)
      if (error) errors.push(error.message || 'Failed to update email')
    }

    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join('. ') })
    } else {
      setMessage({ type: 'success', text: 'Account updated successfully' })
    }

    setSaving(false)
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
