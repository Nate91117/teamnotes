import { useState } from 'react'
import { useReports } from '../../hooks/useReports'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

export default function ReportsDashboard({ members }) {
  const { reports, loading, createReport, updateReport, deleteReport } = useReports()
  const [newTitle, setNewTitle] = useState('')
  const [newMemberId, setNewMemberId] = useState('')
  const [editingReport, setEditingReport] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMemberId, setEditMemberId] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newTitle.trim() || !newMemberId) return
    setSaving(true)
    await createReport(newTitle.trim(), newMemberId)
    setNewTitle('')
    setNewMemberId('')
    setSaving(false)
  }

  function startEdit(report) {
    setEditingReport(report)
    setEditTitle(report.title)
    setEditMemberId(report.assigned_user_id)
  }

  async function saveEdit() {
    if (!editingReport || !editTitle.trim() || !editMemberId) return
    setSaving(true)
    await updateReport(editingReport.id, {
      title: editTitle.trim(),
      assigned_user_id: editMemberId
    })
    setEditingReport(null)
    setSaving(false)
  }

  async function handleDelete(reportId) {
    if (confirm('Delete this report?')) {
      await deleteReport(reportId)
    }
  }

  // Group reports by assigned member
  const reportsByMember = {}
  reports.forEach(report => {
    if (!reportsByMember[report.assigned_user_id]) {
      reportsByMember[report.assigned_user_id] = []
    }
    reportsByMember[report.assigned_user_id].push(report)
  })

  return (
    <div>
      {/* Inline create form */}
      <form onSubmit={handleCreate} className="card mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add Report</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input flex-1"
            placeholder="Report title..."
          />
          <select
            value={newMemberId}
            onChange={(e) => setNewMemberId(e.target.value)}
            className="input w-48"
          >
            <option value="">Assign to...</option>
            {(members || []).map(m => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
          <Button type="submit" disabled={saving || !newTitle.trim() || !newMemberId}>
            {saving ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </form>

      {/* Reports grouped by member */}
      {reports.length === 0 ? (
        <div className="card text-center text-gray-500 dark:text-gray-400 py-8">
          No reports yet. Add one above to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(members || []).map(member => {
            const memberReports = reportsByMember[member.id] || []
            if (memberReports.length === 0) return null

            return (
              <div key={member.id} className="card">
                {/* Member Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                      {member.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{member.display_name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {memberReports.length} report{memberReports.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Report list */}
                <div className="space-y-2">
                  {memberReports.map(report => {
                    if (editingReport?.id === report.id) {
                      return (
                        <div key={report.id} className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="input text-sm w-full"
                              placeholder="Report title"
                            />
                            <select
                              value={editMemberId}
                              onChange={(e) => setEditMemberId(e.target.value)}
                              className="input text-sm w-full"
                            >
                              {(members || []).map(m => (
                                <option key={m.id} value={m.id}>{m.display_name}</option>
                              ))}
                            </select>
                            <div className="flex gap-2 justify-end">
                              <Button variant="secondary" size="small" onClick={() => setEditingReport(null)} disabled={saving}>
                                Cancel
                              </Button>
                              <Button size="small" onClick={saveEdit} disabled={saving || !editTitle.trim() || !editMemberId}>
                                {saving ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={report.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm group"
                      >
                        <span className="flex-1 font-medium text-gray-900 dark:text-white">
                          {report.title}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(report)}
                            className="text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 px-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 px-1"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
