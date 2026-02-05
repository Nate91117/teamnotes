import { Component } from 'react'
import { useTeam } from '../contexts/TeamContext'
import Layout from '../components/common/Layout'
import TasksList from '../components/tasks/TasksList'
import { Link } from 'react-router-dom'

class TasksErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('TasksList crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card text-center py-8">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function MyTasks() {
  const { currentTeam } = useTeam()

  if (!currentTeam) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Team Selected</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be part of a team to create tasks.
          </p>
          <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
            Go to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <TasksErrorBoundary>
        <TasksList />
      </TasksErrorBoundary>
    </Layout>
  )
}
