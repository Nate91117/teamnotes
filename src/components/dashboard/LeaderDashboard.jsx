import { useState, useEffect } from 'react'
import { useTeam } from '../../contexts/TeamContext'
import { supabase } from '../../lib/supabase'
import GoalCard from './GoalCard'
import MemberViewDashboard from './MemberViewDashboard'
import GoalFormModal from './GoalFormModal'
import CategoryManagementModal from './CategoryManagementModal'
import Button from '../common/Button'
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

// Get date string in Central Time (YYYY-MM-DD format for input fields)
function getDateInCentral(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

// Convert YYYY-MM-DD to ISO string at noon UTC (so date stays same in any US timezone)
function dateToNoonUTC(dateStr) {
  if (!dateStr) return null
  return `${dateStr}T12:00:00.000Z`
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

  // Inline linked task editing state
  const [editingLinkedTask, setEditingLinkedTask] = useState(null)
  const [linkedEditTitle, setLinkedEditTitle] = useState('')
  const [linkedEditStatus, setLinkedEditStatus] = useState('todo')
  const [linkedEditDueDate, setLinkedEditDueDate] = useState('')
  const [linkedEditAssignees, setLinkedEditAssignees] = useState([])
  const [linkedEditSaving, setLinkedEditSaving] = useState(false)

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
        .select('id, title, linked_goal_id, status, due_date, completed_at, user_id')
        .eq('team_id', currentTeam.id)
        .eq('shared_to_dashboard', true)
        .not('linked_goal_id', 'is', null)

      if (tasksError) console.error('Error fetching tasks:', tasksError)

      // Batch-fetch assignees for all linked tasks
      const taskIds = (tasksData || []).map(t => t.id)
      let assigneesMap = {}
      if (taskIds.length > 0) {
        const { data: assigneesData } = await supabase
          .from('task_assignees')
          .select('task_id, user_id')
          .in('task_id', taskIds)
        ;(assigneesData || []).forEach(a => {
          if (!assigneesMap[a.task_id]) assigneesMap[a.task_id] = []
          assigneesMap[a.task_id].push(a.user_id)
        })
      }

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
            due_date: task.due_date,
            completed_at: task.completed_at,
            author,
            assignees: assigneesMap[task.id] || []
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
          .select('id, title, status, due_date, completed_at, user_id, is_monthly, monthly_source_id, monthly_month')
          .eq('team_id', currentTeam.id)
          .eq('shared_to_dashboard', true),
        supabase
          .from('notes')
          .select('id, title, content, user_id')
          .eq('team_id', currentTeam.id)
          .eq('shared_to_dashboard', true)
      ])

      const tasks = tasksResult.data || []
      const taskIds = tasks.map(t => t.id)

      // Fetch assignees for all tasks
      let assigneesMap = {}
      if (taskIds.length > 0) {
        const { data: assigneesData } = await supabase
          .from('task_assignees')
          .select('task_id, user_id')
          .in('task_id', taskIds)
        ;(assigneesData || []).forEach(a => {
          if (!assigneesMap[a.task_id]) assigneesMap[a.task_id] = []
          assigneesMap[a.task_id].push(a.user_id)
        })
      }

      // Group tasks by assignee (or creator if no assignees)
      const tasksByMember = {}
      tasks.forEach(task => {
        const assignees = assigneesMap[task.id] || []
        if (assignees.length > 0) {
          assignees.forEach(assigneeId => {
            if (!tasksByMember[assigneeId]) tasksByMember[assigneeId] = []
            tasksByMember[assigneeId].push(task)
          })
        } else {
          if (!tasksByMember[task.user_id]) tasksByMember[task.user_id] = []
          tasksByMember[task.user_id].push(task)
        }
      })

      const notesByMember = {}
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
    setDueDate(getDateInCentral(goal.due_date))
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
        due_date: dateToNoonUTC(dueDate),
        notes,
        show_notes: showNotes,
        category_id: categoryId || null
      })
      await updateGoalMembers(editingGoal.id, assignedMembers)
    } else {
      await createGoal({
        title,
        description,
        due_date: dateToNoonUTC(dueDate),
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

  // Inline linked task editing functions
  function openLinkedTaskEdit(task) {
    setEditingLinkedTask(task)
    setLinkedEditTitle(task.title)
    setLinkedEditStatus(task.status)
    setLinkedEditDueDate(getDateInCentral(task.due_date))
    setLinkedEditAssignees(task.assignees || [])
  }

  function cancelLinkedTaskEdit() {
    setEditingLinkedTask(null)
    setLinkedEditTitle('')
    setLinkedEditStatus('todo')
    setLinkedEditDueDate('')
    setLinkedEditAssignees([])
  }

  async function saveLinkedTaskEdit() {
    if (!editingLinkedTask || !linkedEditTitle.trim()) return
    setLinkedEditSaving(true)

    const updates = {
      title: linkedEditTitle.trim(),
      status: linkedEditStatus,
      due_date: dateToNoonUTC(linkedEditDueDate)
    }

    if (linkedEditStatus === 'done' && editingLinkedTask.status !== 'done') {
      updates.completed_at = new Date().toISOString()
    } else if (linkedEditStatus !== 'done' && editingLinkedTask.status === 'done') {
      updates.completed_at = null
    }

    await supabase
      .from('tasks')
      .update(updates)
      .eq('id', editingLinkedTask.id)

    await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', editingLinkedTask.id)
    if (linkedEditAssignees.length > 0) {
      await supabase
        .from('task_assignees')
        .insert(linkedEditAssignees.map(uid => ({ task_id: editingLinkedTask.id, user_id: uid })))
    }

    setLinkedEditSaving(false)
    setEditingLinkedTask(null)
    fetchLinkedItems()
  }

  function toggleLinkedTaskAssignee(memberId) {
    setLinkedEditAssignees(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const linkedTaskEditProps = {
    editingTask: editingLinkedTask,
    editTitle: linkedEditTitle,
    setEditTitle: setLinkedEditTitle,
    editStatus: linkedEditStatus,
    setEditStatus: setLinkedEditStatus,
    editDueDate: linkedEditDueDate,
    setEditDueDate: setLinkedEditDueDate,
    editAssignees: linkedEditAssignees,
    toggleAssignee: toggleLinkedTaskAssignee,
    saving: linkedEditSaving,
    openEdit: openLinkedTaskEdit,
    cancelEdit: cancelLinkedTaskEdit,
    saveEdit: saveLinkedTaskEdit
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
          onTaskUpdate={() => { fetchMemberData(); fetchLinkedItems(); }}
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
                      linkedTaskEdit={linkedTaskEditProps}
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
                linkedTaskEdit={linkedTaskEditProps}
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
                linkedTaskEdit={linkedTaskEditProps}
              />
            ))}
          </div>
        </section>
      )}

      </>
      )}

      {/* Goal Modal */}
      <GoalFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingGoal={editingGoal}
        title={title} setTitle={setTitle}
        description={description} setDescription={setDescription}
        dueDate={dueDate} setDueDate={setDueDate}
        notes={notes} setNotes={setNotes}
        showNotes={showNotes} setShowNotes={setShowNotes}
        assignedMembers={assignedMembers} toggleMember={toggleMember}
        categoryId={categoryId} setCategoryId={setCategoryId}
        categories={categories}
        members={members}
        onSubmit={handleSubmit}
        onReset={resetForm}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        createCategory={createCategory}
        updateCategory={updateCategory}
        deleteCategory={deleteCategory}
      />
    </div>
  )
}
