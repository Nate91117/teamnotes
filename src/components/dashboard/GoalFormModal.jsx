import Button from '../common/Button'
import Modal from '../common/Modal'

export default function GoalFormModal({
  isOpen,
  onClose,
  editingGoal,
  title, setTitle,
  description, setDescription,
  dueDate, setDueDate,
  notes, setNotes,
  showNotes, setShowNotes,
  assignedMembers, toggleMember,
  categoryId, setCategoryId,
  categories,
  members,
  onSubmit,
  onReset
}) {
  function handleClose() {
    onClose()
    onReset()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingGoal ? 'Edit Goal' : 'Create Goal'}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {editingGoal ? 'Save Changes' : 'Create Goal'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
  )
}
