import { useState, useMemo } from 'react'
import { useTodoLists } from '../../hooks/useTodoLists'
import Modal from '../common/Modal'
import Button from '../common/Button'
import TodoEditor from './TodoEditor'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getTodayCST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getDayLabel(dateStr, todayStr) {
  const diff = Math.round(
    (new Date(dateStr + 'T12:00:00') - new Date(todayStr + 'T12:00:00')) / (1000 * 60 * 60 * 24)
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })
}

function getTimelineBuckets(items, today) {
  const buckets = []

  // Overdue — non-null due_date in the past
  const overdue = items.filter(i => i.due_date && i.due_date < today)
  if (overdue.length > 0) {
    buckets.push({ id: 'overdue', label: 'Overdue', date: null, items: overdue, isOverdue: true })
  }

  // Today + next 7 individual days
  for (let i = 0; i < 8; i++) {
    const dateStr = addDays(today, i)
    const label = getDayLabel(dateStr, today)
    const dayItems = items.filter(item => item.due_date === dateStr)
    buckets.push({ id: dateStr, label, date: dateStr, items: dayItems, isToday: i === 0 })
  }

  // Next week: days 8–14 out
  const nwStart = addDays(today, 8)
  const nwEnd = addDays(today, 14)
  const nextWeekItems = items.filter(i => i.due_date && i.due_date >= nwStart && i.due_date <= nwEnd)
  if (nextWeekItems.length > 0) {
    buckets.push({ id: 'next-week', label: 'Next Week', date: null, items: nextWeekItems })
  }

  // Further out
  const laterItems = items.filter(i => i.due_date && i.due_date > nwEnd)
  if (laterItems.length > 0) {
    buckets.push({ id: 'later', label: 'Further Out', date: null, items: laterItems })
  }

  // No due date
  const noDateItems = items.filter(i => !i.due_date)
  if (noDateItems.length > 0) {
    buckets.push({ id: 'no-date', label: 'No Due Date', date: null, items: noDateItems })
  }

  return buckets
}

// Inline quick-add bar at the bottom of each bucket/list
function QuickAdd({ date, lists, fixedListId, onAdd }) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [listId, setListId] = useState(fixedListId || '')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await onAdd({ title: title.trim(), due_date: date || null, list_id: fixedListId || listId || null })
    setTitle('')
    // Keep the form open for rapid entry
  }

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="mt-2 text-sm text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 transition-colors"
      >
        + Add item
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3 flex-wrap sm:flex-nowrap">
      <input
        type="text"
        className="input text-sm py-1.5 flex-1 min-w-0"
        placeholder="Task title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />
      {!fixedListId && lists.length > 0 && (
        <select
          className="input text-sm py-1.5 w-28 flex-shrink-0"
          value={listId}
          onChange={e => setListId(e.target.value)}
        >
          <option value="">No list</option>
          {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      )}
      <button type="submit" className="btn-primary text-sm py-1.5 px-3 flex-shrink-0">Add</button>
      <button
        type="button"
        onClick={() => { setActive(false); setTitle('') }}
        className="btn-secondary text-sm py-1.5 px-2 flex-shrink-0"
      >
        ✕
      </button>
    </form>
  )
}

// Single to-do row
function TodoItemRow({ item, lists, onToggle, onEdit, onDelete }) {
  const list = lists.find(l => l.id === item.list_id)

  return (
    <div className={`flex items-center gap-3 py-2 px-1 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${item.completed ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => onToggle(item.id)}
        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0 cursor-pointer"
      />
      <span className={`flex-1 text-sm min-w-0 truncate ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
        {item.title}
      </span>
      {list && (
        <span className="badge badge-blue text-xs flex-shrink-0">{list.name}</span>
      )}
      {item.is_weekly && item.weekly_source_id && (
        <span className="badge badge-gray text-xs flex-shrink-0">Weekly</span>
      )}
      {item.is_monthly && item.monthly_source_id && (
        <span className="badge badge-gray text-xs flex-shrink-0">Monthly</span>
      )}
      <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          title="Edit"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function TodoLists() {
  const {
    lists, visibleItems, weeklyTemplates, monthlyTemplates, loading,
    createList, updateList, deleteList,
    createItem, updateItem, toggleItem, deleteItem,
    ensureWeeklyTasks, ensureMonthlyTasks
  } = useTodoLists()

  const [view, setView] = useState('timeline')
  const [hideCompleted, setHideCompleted] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showManageLists, setShowManageLists] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)

  // Manage lists modal state
  const [newListName, setNewListName] = useState('')
  const [editingListId, setEditingListId] = useState(null)
  const [editingListName, setEditingListName] = useState('')

  const today = getTodayCST()
  const displayItems = hideCompleted ? visibleItems.filter(i => !i.completed) : visibleItems
  const timelineBuckets = useMemo(() => getTimelineBuckets(displayItems, today), [displayItems, today])
  const hasAnyItems = displayItems.length > 0

  function openNewItem() {
    setEditingItem(null)
    setShowEditor(true)
  }

  function openEditItem(item) {
    setEditingItem(item)
    setShowEditor(true)
  }

  async function handleSaveItem(data) {
    if (editingItem) {
      await updateItem(editingItem.id, data)
    } else {
      const { error } = await createItem(data)
      if (!error) {
        // Immediately generate an instance for the new recurring template
        if (data.is_weekly) await ensureWeeklyTasks()
        if (data.is_monthly) await ensureMonthlyTasks()
      }
    }
  }

  async function handleDeleteItem(id) {
    if (window.confirm('Delete this to-do?')) {
      await deleteItem(id)
    }
  }

  async function handleCreateList(e) {
    e.preventDefault()
    if (!newListName.trim()) return
    await createList(newListName.trim())
    setNewListName('')
  }

  async function handleRenameList(e) {
    e.preventDefault()
    if (!editingListName.trim()) return
    await updateList(editingListId, { name: editingListName.trim() })
    setEditingListId(null)
    setEditingListName('')
  }

  async function handleDeleteList(id) {
    if (window.confirm('Delete this list? Items will be kept but unassigned.')) {
      await deleteList(id)
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
            <div className="space-y-2.5">
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">To-Do Lists</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setHideCompleted(h => !h)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              hideCompleted
                ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-400'
                : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {hideCompleted ? 'Show Completed' : 'Hide Completed'}
          </button>
          <button onClick={() => setShowManageLists(true)} className="btn-secondary text-sm">
            Manage Lists
          </button>
          <button onClick={openNewItem} className="btn-primary text-sm">
            + New Item
          </button>
        </div>
      </div>

      {/* ── View toggle ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {[
          { value: 'timeline', label: 'Timeline' },
          { value: 'list', label: 'By List' }
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setView(value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Timeline view ───────────────────────────────────────────────────── */}
      {view === 'timeline' && (
        <div className="space-y-4">
          {!hasAnyItems ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No to-dos yet.</p>
              <button onClick={openNewItem} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Add your first one ↑
              </button>
            </div>
          ) : (
            timelineBuckets.map(bucket => (
              <div
                key={bucket.id}
                className={`card ${bucket.isOverdue ? 'border-red-200 dark:border-red-900/60' : ''}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${
                    bucket.isOverdue
                      ? 'text-red-600 dark:text-red-400'
                      : bucket.isToday
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {bucket.label}
                  </h3>
                  {bucket.date && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(bucket.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {bucket.items.length > 0 && (
                    <span className="ml-auto badge badge-gray">{bucket.items.length}</span>
                  )}
                </div>

                {bucket.items.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No items</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {bucket.items.map(item => (
                      <TodoItemRow
                        key={item.id}
                        item={item}
                        lists={lists}
                        onToggle={toggleItem}
                        onEdit={openEditItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                )}

                <QuickAdd
                  date={bucket.date}
                  lists={lists}
                  onAdd={createItem}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* ── By List view ────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="space-y-4">
          {lists.length === 0 && displayItems.filter(i => !i.list_id).length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No lists yet.</p>
              <button
                onClick={() => setShowManageLists(true)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Create a list →
              </button>
            </div>
          ) : (
            <>
              {lists.map(list => {
                const listItems = displayItems.filter(i => i.list_id === list.id)
                return (
                  <div key={list.id} className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{list.name}</h3>
                      <span className="badge badge-gray">{listItems.length}</span>
                    </div>
                    {listItems.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">No items in this list</p>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {listItems.map(item => (
                          <TodoItemRow
                            key={item.id}
                            item={item}
                            lists={lists}
                            onToggle={toggleItem}
                            onEdit={openEditItem}
                            onDelete={handleDeleteItem}
                          />
                        ))}
                      </div>
                    )}
                    <QuickAdd
                      date={null}
                      lists={lists}
                      fixedListId={list.id}
                      onAdd={createItem}
                    />
                  </div>
                )
              })}

              {/* Uncategorized items */}
              {(() => {
                const uncat = displayItems.filter(i => !i.list_id)
                if (uncat.length === 0) return null
                return (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-gray-500 dark:text-gray-400">Uncategorized</h3>
                      <span className="badge badge-gray">{uncat.length}</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {uncat.map(item => (
                        <TodoItemRow
                          key={item.id}
                          item={item}
                          lists={lists}
                          onToggle={toggleItem}
                          onEdit={openEditItem}
                          onDelete={handleDeleteItem}
                        />
                      ))}
                    </div>
                    <QuickAdd date={null} lists={lists} onAdd={createItem} />
                  </div>
                )
              })()}
            </>
          )}
        </div>
      )}

      {/* ── Recurring Templates ──────────────────────────────────────────────── */}
      {(weeklyTemplates.length > 0 || monthlyTemplates.length > 0) && (
        <div className="card">
          <button
            onClick={() => setShowRecurring(s => !s)}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <span>Recurring Templates ({weeklyTemplates.length + monthlyTemplates.length})</span>
            <svg
              className={`w-4 h-4 transition-transform ${showRecurring ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showRecurring && (
            <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-700/50">
              {weeklyTemplates.map(item => {
                const list = lists.find(l => l.id === item.list_id)
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2 group">
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{item.title}</span>
                    {list && <span className="badge badge-blue text-xs">{list.name}</span>}
                    <span className="badge badge-yellow text-xs">Weekly – {DAYS[item.weekly_day]}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => openEditItem(item)}
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Edit template"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete template"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}

              {monthlyTemplates.map(item => {
                const list = lists.find(l => l.id === item.list_id)
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2 group">
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{item.title}</span>
                    {list && <span className="badge badge-blue text-xs">{list.name}</span>}
                    <span className="badge badge-orange text-xs">Monthly</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => openEditItem(item)}
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Edit template"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete template"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Todo Editor Modal ────────────────────────────────────────────────── */}
      <TodoEditor
        item={editingItem}
        isOpen={showEditor}
        onClose={() => { setShowEditor(false); setEditingItem(null) }}
        lists={lists}
        onSave={handleSaveItem}
      />

      {/* ── Manage Lists Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={showManageLists}
        onClose={() => { setShowManageLists(false); setEditingListId(null) }}
        title="Manage Lists"
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateList} className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="New list name..."
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
            />
            <Button type="submit" disabled={!newListName.trim()}>
              Create
            </Button>
          </form>

          {lists.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No lists yet</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lists.map(list => (
                <div key={list.id}>
                  {editingListId === list.id ? (
                    <form onSubmit={handleRenameList} className="flex gap-2">
                      <input
                        type="text"
                        className="input text-sm py-1.5 flex-1"
                        value={editingListName}
                        onChange={e => setEditingListName(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className="btn-primary text-sm py-1.5 px-3">Save</button>
                      <button
                        type="button"
                        onClick={() => setEditingListId(null)}
                        className="btn-secondary text-sm py-1.5 px-2"
                      >
                        ✕
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{list.name}</span>
                      <button
                        onClick={() => { setEditingListId(list.id); setEditingListName(list.name) }}
                        className="text-xs text-gray-400 hover:text-primary-600 px-2 py-1 transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
