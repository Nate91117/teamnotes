import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { TeamProvider } from './contexts/TeamContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import MyNotes from './pages/MyNotes'
import MyTasks from './pages/MyTasks'
import TeamSettings from './pages/TeamSettings'
import PersonalGoals from './pages/PersonalGoals'
import Settings from './pages/Settings'
import Reports from './pages/Reports'

function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/notes" element={
            <ProtectedRoute>
              <MyNotes />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <MyTasks />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <TeamSettings />
            </ProtectedRoute>
          } />
          <Route path="/personal-goals" element={
            <ProtectedRoute>
              <PersonalGoals />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </TeamProvider>
    </AuthProvider>
  )
}

export default App
