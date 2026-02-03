import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SignupForm from '../components/auth/SignupForm'

export default function Signup() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TeamNotes</h1>
          <p className="text-gray-600">
            Create your account to get started
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Sign Up
          </h2>
          <SignupForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          If you were invited to a team, use the same email address to automatically join.
        </p>
      </div>
    </div>
  )
}
