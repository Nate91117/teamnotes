import { useTeam as useTeamContext } from '../contexts/TeamContext'

export function useTeam() {
  return useTeamContext()
}

export default useTeam
