import { useState } from 'react'
import Button from '../common/Button'
import Modal from '../common/Modal'

const categoryColors = {
  indigo: { bg: 'bg-indigo-50', header: 'text-indigo-700' },
  orange: { bg: 'bg-orange-50', header: 'text-orange-700' },
  cyan: { bg: 'bg-cyan-50', header: 'text-cyan-700' },
  green: { bg: 'bg-green-50', header: 'text-green-700' },
  purple: { bg: 'bg-purple-50', header: 'text-purple-700' },
  pink: { bg: 'bg-pink-50', header: 'text-pink-700' },
  gray: { bg: 'bg-gray-50', header: 'text-gray-700' },
}

export default function CategoryManagementModal({
  isOpen,
  onClose,
  categories,
  createCategory,
  updateCategory,
  deleteCategory
}) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState('')

  function handleClose() {
    setEditingCategory(null)
    setEditCategoryName('')
    onClose()
  }

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Categories"
      footer={
        <Button variant="secondary" onClick={handleClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
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
  )
}
