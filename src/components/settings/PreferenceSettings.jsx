import { useState, useEffect } from 'react'

export default function PreferenceSettings() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('teamnotes_dark_mode') === 'true'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('teamnotes_dark_mode', darkMode)
  }, [darkMode])

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Switch between light and dark themes
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={darkMode}
          onClick={() => setDarkMode(!darkMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              darkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
