import { useTeam } from '../../contexts/TeamContext'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../common/Button'

export default function MemberList() {
  const { members, isLeader, removeMember, currentTeam } = useTeam()
  const { user } = useAuth()

  async function handleRemove(member) {
    if (member.id === currentTeam?.leader_id) {
      alert('Cannot remove the team leader.')
      return
    }

    if (confirm(`Remove ${member.display_name} from the team?`)) {
      await removeMember(member.id)
    }
  }

  return (
    <div className="space-y-3">
      {members.map(member => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-700 dark:text-primary-400 font-medium">
                {member.display_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {member.display_name}
                {member.id === user?.id && (
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">(you)</span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`badge ${member.role === 'leader' ? 'badge-blue' : 'badge-gray'}`}>
              {member.role}
            </span>

            {isLeader && member.id !== user?.id && member.role !== 'leader' && (
              <Button
                variant="ghost"
                size="small"
                onClick={() => handleRemove(member)}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
