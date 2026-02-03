import { NavLink, useNavigate } from 'react-router-dom'
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

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Team */}
            <div className="flex items-center gap-4">
              <NavLink to="/dashboard" className="text-xl font-bold text-primary-600">
                TeamNotes
              </NavLink>
              {currentTeam && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                  <span className="text-sm text-gray-600">{currentTeam.name}</span>
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
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-gray-600">
                {profile?.display_name}
              </span>
              <Button variant="secondary" size="small" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600'
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
