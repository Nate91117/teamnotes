import { useState } from 'react'
import { useNotes } from '../../hooks/useNotes'
import NoteCard from './NoteCard'
import NoteEditor from './NoteEditor'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

export default function NotesList() {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes()
  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [filter, setFilter] = useState('all')

  function openCreate() {
    setEditingNote(null)
    setShowEditor(true)
  }

  function openEdit(note) {
    setEditingNote(note)
    setShowEditor(true)
  }

  async function handleSave(data) {
    if (editingNote) {
      await updateNote(editingNote.id, data)
    } else {
      await createNote(data)
    }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id)
    }
  }

  async function handleToggleShare(note) {
    await updateNote(note.id, { shared_to_dashboard: !note.shared_to_dashboard })
  }

  const filteredNotes = notes.filter(note => {
    if (filter === 'all') return true
    if (filter === 'shared') return note.shared_to_dashboard
    if (filter === 'linked') return note.linked_goal_id
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Notes</h2>
          <p className="text-gray-600 dark:text-gray-400">{notes.length} notes</p>
        </div>
        <Button onClick={openCreate}>
          + New Note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'shared', 'linked'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="card text-center text-gray-500 dark:text-gray-400 py-12">
          {filter === 'all' ? (
            <>
              <p className="mb-4">No notes yet. Create your first note!</p>
              <Button onClick={openCreate}>+ New Note</Button>
            </>
          ) : (
            <p>No {filter} notes found.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleShare={handleToggleShare}
            />
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <NoteEditor
        note={editingNote}
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleSave}
      />
    </div>
  )
}
