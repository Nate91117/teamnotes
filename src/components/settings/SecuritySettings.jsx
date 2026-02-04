import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../common/Button'

export default function SecuritySettings() {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setSaving(true)

    const { error } = await changePassword(currentPassword, newPassword)

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' })
    } else {
      setMessage({ type: 'success', text: 'Password changed successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setSaving(false)
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            required
            minLength={6}
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
          {saving ? 'Changing...' : 'Change Password'}
        </Button>
      </form>
    </div>
  )
}
