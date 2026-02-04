import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTeam } from '../../contexts/TeamContext'
import Button from './Button'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/notes', label: 'My Notes' },
  { to: '/tasks', label: 'My Tasks' },
  { to: '/team', label: 'Team' }
]

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const { currentTeam, isLeader } = useTeam()
  const navigate = useNavigate()
  const location = useLocation()

  const isSettingsActive = location.pathname === '/settings'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Team */}
            <div className="flex items-center gap-4">
              <NavLink to="/dashboard" className="text-xl font-bold text-primary-600">
                TeamNotes
              </NavLink>
              {currentTeam && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg dark:bg-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{currentTeam.name}</span>
                  {isLeader && (
                    <span className="badge badge-blue text-xs">Leader</span>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                {profile?.display_name}
              </span>
              <button
                onClick={() => navigate('/settings')}
                className={`p-2 rounded-lg transition-colors ${
                  isSettingsActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <Button variant="secondary" size="small" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex gap-2 overflow-x-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
