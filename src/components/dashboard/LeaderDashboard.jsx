import { useState, useEffect } from 'react'
import { useTeam } from '../../contexts/TeamContext'
import { supabase } from '../../lib/supabase'
import GoalCard from './GoalCard'
import MemberViewDashboard from './MemberViewDashboard'
import Button from '../common/Button'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'

const categoryColors = {
  indigo: { bg: 'bg-indigo-50', header: 'text-indigo-700', badge: 'bg-indigo-200 text-indigo-800' },
  orange: { bg: 'bg-orange-50', header: 'text-orange-700', badge: 'bg-orange-200 text-orange-800' },
  cyan: { bg: 'bg-cyan-50', header: 'text-cyan-700', badge: 'bg-cyan-200 text-cyan-800' },
  green: { bg: 'bg-green-50', header: 'text-green-700', badge: 'bg-green-200 text-green-800' },
  purple: { bg: 'bg-purple-50', header: 'text-purple-700', badge: 'bg-purple-200 text-purple-800' },
  pink: { bg: 'bg-pink-50', header: 'text-pink-700', badge: 'bg-pink-200 text-pink-800' },
  gray: { bg: 'bg-gray-50', header: 'text-gray-700', badge: 'bg-gray-200 text-gray-800' },
}

export default function LeaderDashboard() {
  const { currentTeam, goals, createGoal, updateGoal, deleteGoal, updateGoalMembers, members, categories, createCategory, updateCategory, deleteCategory } = useTeam()
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [assignedMembers, setAssignedMembers] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [linkedItems, setLinkedItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [dashboardView, setDashboardView] = useState('goals')
  const [memberTasks, setMemberTasks] = useState({})
  const [memberNotes, setMemberNotes] = useState({})

  // Category management state
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState('')

  useEffect(() => {
    if (currentTeam) {
      fetchLinkedItems()
      if (dashboardView === 'members') {
        fetchMemberData()
      }
    }
  }, [currentTeam, goals, dashboardView])

  async function fetchLinkedItems() {
    if (!currentTeam?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    const items = {}

    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, linked_goal_id, status, user_id')
        .eq('team_id', currentTeam.id)
        .eq('shared_to_dashboard', true)
        .not('linked_goal_id', 'is', null)

      if (tasksError) console.error('Error fetching tasks:', tasksError)

      if (goals && Array.isArray(goals)) {
        goals.forEach(goal => {
          if (goal?.id) {
            items[goal.id] = []
          }
        })
      }

      tasksData?.forEach(task => {
        if (task?.linked_goal_id && items[task.linked_goal_id]) {
          const author = members.find(m => m.id === task.user_id)?.display_name || 'Unknown'
          items[task.linked_goal_id].push({
            type: 'task',
            id: task.id,
            title: task.title,
            status: task.status,
            author
          })
        }
      })

      setLinkedItems(items)
    } catch (err) {
      console.error('Error in fetchLinkedItems:', err)
      setLinkedItems({})
    } finally {
      setLoading(false)
    }
  }

  async function fetchMemberData() {
    if (!currentTeam?.id) return

    try {
      const [tasksResult, notesResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, status, due_date, user_id')
          .eq('team_id', currentTeam.id)
          .eq('shared_to_dashboard', true),
        supabase
          .from('notes')
          .select('id, title, content, user_id')
          .eq('team_id', currentTeam.id)
          .eq('shared_to_dashboard', true)
      ])

      const tasksByMember = {}
      const notesByMember = {}

      ;(tasksResult.data || []).forEach(task => {
        if (!tasksByMember[task.user_id]) tasksByMember[task.user_id] = []
        tasksByMember[task.user_id].push(task)
      })

      ;(notesResult.data || []).forEach(note => {
        if (!notesByMember[note.user_id]) notesByMember[note.user_id] = []
        notesByMember[note.user_id].push(note)
      })

      setMemberTasks(tasksByMember)
      setMemberNotes(notesByMember)
    } catch (err) {
      console.error('Error fetching member data:', err)
    }
  }

  function openCreateModal() {
    setEditingGoal(null)
    setTitle('')
    setDescription('')
    setDueDate('')
    setNotes('')
    setShowNotes(false)
    setAssignedMembers([])
    setCategoryId('')
    setShowModal(true)
  }

  function openEditModal(goal) {
    setEditingGoal(goal)
    setTitle(goal.title)
    setDescription(goal.description || '')
    setDueDate(goal.due_date ? goal.due_date.split('T')[0] : '')
    setNotes(goal.notes || '')
    setShowNotes(goal.show_notes || false)
    setAssignedMembers(goal.assigned_members || [])
    setCategoryId(goal.category_id || '')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        title,
        description,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        notes,
        show_notes: showNotes,
        category_id: categoryId || null
      })
      await updateGoalMembers(editingGoal.id, assignedMembers)
    } else {
      await createGoal({
        title,
        description,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        notes,
        show_notes: showNotes,
        assigned_members: assignedMembers,
        category_id: categoryId || null
      })
    }

    setShowModal(false)
    resetForm()
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setDueDate('')
    setNotes('')
    setShowNotes(false)
    setAssignedMembers([])
    setCategoryId('')
    setEditingGoal(null)
  }

  async function handleDelete(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(goalId)
    }
  }

  function toggleMember(memberId) {
    setAssignedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  // Category management functions
  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    await createCategory(newCategoryName.trim(), 'gray')
    setNewCategoryName('')
  }

  async function handleUpdateCategory(e) {
    e.preventDefault()
    if (!editCategoryName.trim() || !editingCategory) return
    await updateCategory(editingCategory.id, { name: editCategoryName.trim() })
    setEditingCategory(null)
    setEditCategoryName('')
  }

  async function handleDeleteCategory(categoryToDelete) {
    if (confirm(`Delete "${categoryToDelete.name}"? Goals in this category will become uncategorized.`)) {
      await deleteCategory(categoryToDelete.id)
    }
  }

  // Sort by due date (nulls last)
  function sortByDueDate(a, b) {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  }

  const activeGoals = (goals || []).filter(g => g?.status === 'active')
  const completedGoals = (goals || []).filter(g => g?.status === 'completed')

  // Group active goals by category_id and sort by due date
  const goalsByCategory = {}
  categories.forEach(cat => {
    goalsByCategory[cat.id] = activeGoals
      .filter(g => g.category_id === cat.id)
      .sort(sortByDueDate)
  })
  const uncategorizedGoals = activeGoals
    .filter(g => !g.category_id)
    .sort(sortByDueDate)

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {(members || []).length} members | {activeGoals.length} active goals
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setDashboardView('goals')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                dashboardView === 'goals' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setDashboardView('members')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                dashboardView === 'members' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              By Member
            </button>
          </div>
          {dashboardView === 'goals' && (
            <>
              <Button variant="secondary" onClick={() => setShowCategoryModal(true)}>
                Manage Categories
              </Button>
              <Button onClick={openCreateModal}>
                + New Goal
              </Button>
            </>
          )}
        </div>
      </div>

      {dashboardView === 'members' ? (
        <MemberViewDashboard
          members={members}
          memberTasks={memberTasks}
          memberNotes={memberNotes}
        />
      ) : (
      <>
      {/* Goals by Category - Dynamic Columns */}
      {activeGoals.length === 0 && categories.length === 0 ? (
        <div className="card text-center text-gray-500 dark:text-gray-400 py-8 mb-8">
          No active goals. Create one to get started!
        </div>
      ) : categories.length === 0 ? (
        <div className="card text-center text-gray-500 dark:text-gray-400 py-8 mb-8">
          No categories yet. Click "Manage Categories" to create some!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {categories.map(cat => {
            const colors = categoryColors[cat.color] || categoryColors.gray
            const categoryGoals = goalsByCategory[cat.id] || []
            return (
              <div key={cat.id} className={`${colors.bg} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className={`font-semibold ${colors.header}`}>{cat.name}</h3>
                  <span className={`${colors.badge} px-2 py-0.5 rounded-full text-xs font-medium`}>
                    {categoryGoals.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {categoryGoals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      isLeader={true}
                      linkedItems={linkedItems[goal.id] || []}
                      members={members}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Uncategorized Goals */}
      {uncategorizedGoals.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">Uncategorized</h3>
          <div className="space-y-4">
            {uncategorizedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditModal}
                onDelete={handleDelete}
                isLeader={true}
                linkedItems={linkedItems[goal.id] || []}
                members={members}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">Completed Goals</h3>
          <div className="space-y-4 opacity-75">
            {completedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditModal}
                onDelete={handleDelete}
                isLeader={true}
                linkedItems={linkedItems[goal.id] || []}
                members={members}
              />
            ))}
          </div>
        </section>
      )}

      </>
      )}

      {/* Goal Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingGoal ? 'Edit Goal' : 'Create Goal'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Enter goal title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date (optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category (optional)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input"
              >
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign to Members
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {members.length === 0 ? (
                <span className="text-gray-500 dark:text-gray-400 text-sm">No team members yet</span>
              ) : (
                members.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      assignedMembers.includes(member.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {member.display_name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Add notes for this goal..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showNotes"
              checked={showNotes}
              onChange={(e) => setShowNotes(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="showNotes" className="text-sm text-gray-700 dark:text-gray-300">
              Show notes expanded by default
            </label>
          </div>
        </form>
      </Modal>

      {/* Category Management Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null); setEditCategoryName(''); }}
        title="Manage Categories"
        footer={
          <Button variant="secondary" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setEditCategoryName(''); }}>
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Add new category */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="input flex-1"
              placeholder="New category name..."
            />
            <Button type="submit" disabled={!newCategoryName.trim()}>
              Add
            </Button>
          </form>

          {/* List existing categories */}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No categories yet</p>
            ) : (
              categories.map(cat => {
                const colors = categoryColors[cat.color] || categoryColors.gray
                return (
                  <div key={cat.id} className={`${colors.bg} p-3 rounded-lg flex items-center gap-2`}>
                    {editingCategory?.id === cat.id ? (
                      <form onSubmit={handleUpdateCategory} className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="input flex-1"
                          autoFocus
                        />
                        <Button type="submit" size="small">Save</Button>
                        <Button type="button" variant="ghost" size="small" onClick={() => { setEditingCategory(null); setEditCategoryName(''); }}>
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <>
                        <span className={`flex-1 font-medium ${colors.header}`}>{cat.name}</span>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => { setEditingCategory(cat); setEditCategoryName(cat.name); }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteCategory(cat)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
