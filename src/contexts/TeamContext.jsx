import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const TeamContext = createContext({})

export function useTeam() {
  return useContext(TeamContext)
}

export function TeamProvider({ children }) {
  const { user, profile } = useAuth()
  const [teams, setTeams] = useState([])
  const [currentTeam, setCurrentTeam] = useState(null)
  const [membership, setMembership] = useState(null)
  const [goals, setGoals] = useState([])
  const [members, setMembers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTeams().finally(() => {
        setLoading(false)
      })
    } else {
      setTeams([])
      setCurrentTeam(null)
      setMembership(null)
      setGoals([])
      setMembers([])
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (currentTeam) {
      fetchGoals()
      fetchMembers()
      fetchCategories()
      const unsubscribe = subscribeToGoals()
      return () => {
        if (unsubscribe) unsubscribe()
      }
    }
  }, [currentTeam])

  async function fetchTeams() {
    try {
      // First get team memberships
      const { data: memberships, error: memberError } = await supabase
        .from('team_members')
        .select('team_id, role, joined_at')
        .eq('user_id', user.id)

      if (memberError) {
        console.error('Error fetching memberships:', memberError)
        setTeams([])
        return
      }

      if (!memberships || memberships.length === 0) {
        setTeams([])
        return
      }

      // Then get team details
      const teamIds = memberships.map(m => m.team_id)
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, leader_id, created_at')
        .in('id', teamIds)

      if (teamsError) {
        console.error('Error fetching teams:', teamsError)
        setTeams([])
        return
      }

      // Combine the data
      const userTeams = memberships.map(m => {
        const team = teamsData?.find(t => t.id === m.team_id)
        return team ? {
          ...team,
          role: m.role,
          joined_at: m.joined_at
        } : null
      }).filter(t => t !== null)

      setTeams(userTeams)

      if (userTeams.length > 0 && !currentTeam) {
        selectTeam(userTeams[0])
      }
    } catch (err) {
      console.error('Error fetching teams:', err)
      setTeams([])
    }
  }

  async function selectTeam(team) {
    setCurrentTeam(team)
    setMembership({ role: team.role })
    setLoading(false)
  }

  async function fetchGoals() {
    if (!currentTeam) return

    // Fetch goals
    const { data: goalsData, error } = await supabase
      .from('goals')
      .select('*')
      .eq('team_id', currentTeam.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error || !goalsData) {
      console.error('Error fetching goals:', error)
      return
    }

    // Fetch goal members for all goals
    const goalIds = goalsData.map(g => g.id)
    if (goalIds.length > 0) {
      const { data: goalMembersData } = await supabase
        .from('goal_members')
        .select('goal_id, user_id')
        .in('goal_id', goalIds)

      // Attach assigned members to each goal
      const goalsWithMembers = goalsData.map(goal => ({
        ...goal,
        assigned_members: goalMembersData?.filter(gm => gm.goal_id === goal.id).map(gm => gm.user_id) || []
      }))

      setGoals(goalsWithMembers)
    } else {
      setGoals(goalsData)
    }
  }

  async function fetchMembers() {
    if (!currentTeam) return

    try {
      // Get team members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('user_id, role, joined_at')
        .eq('team_id', currentTeam.id)

      if (memberError || !memberData) {
        console.error('Error fetching members:', memberError)
        setMembers([])
        return
      }

      // Get profiles for those members
      const userIds = memberData.map(m => m.user_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        setMembers([])
        return
      }

      // Combine the data
      const membersWithProfiles = memberData.map(m => {
        const profile = profilesData?.find(p => p.id === m.user_id)
        return profile ? {
          ...profile,
          role: m.role,
          joined_at: m.joined_at
        } : null
      }).filter(m => m !== null)

      setMembers(membersWithProfiles)
    } catch (err) {
      console.error('Error in fetchMembers:', err)
      setMembers([])
    }
  }

  function subscribeToGoals() {
    if (!currentTeam) return

    const subscription = supabase
      .channel(`goals-${currentTeam.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'goals',
        filter: `team_id=eq.${currentTeam.id}`
      }, fetchGoals)
      .subscribe()

    return () => subscription.unsubscribe()
  }

  async function fetchCategories() {
    if (!currentTeam) return

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('team_id', currentTeam.id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return
    }
    setCategories(data || [])
  }

  async function createCategory(name, color = 'gray') {
    if (!currentTeam) return { error: 'No team selected' }

    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order || 0)) + 1 : 0

    const { data, error } = await supabase
      .from('categories')
      .insert({
        team_id: currentTeam.id,
        name,
        color,
        sort_order: maxOrder
      })
      .select()
      .single()

    if (!error && data) {
      setCategories([...categories, data])
    }
    return { data, error }
  }

  async function updateCategory(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setCategories(categories.map(c => c.id === id ? data : c))
    }
    return { data, error }
  }

  async function deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (!error) {
      setCategories(categories.filter(c => c.id !== id))
    }
    return { error }
  }

  async function createTeam(name) {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          leader_id: user.id
        })
        .select()
        .single()

      if (teamError) {
        console.error('Error creating team:', teamError)
        return { error: teamError }
      }

      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'leader'
        })

      if (memberError) {
        console.error('Error adding member:', memberError)
        return { error: memberError }
      }

      await fetchTeams()

      // Select the new team
      selectTeam({ ...team, role: 'leader' })

      return { data: team }
    } catch (err) {
      console.error('Error in createTeam:', err)
      return { error: err }
    }
  }

  async function createGoal({ title, description = '', due_date = null, notes = '', show_notes = false, assigned_members = [], category_id = null }) {
    if (!currentTeam) return { error: 'No team selected' }

    // Get max rank to add new goal at the end
    const maxRank = goals.length > 0 ? Math.max(...goals.map(g => g.sort_order || 0)) + 1 : 0

    const { data, error } = await supabase
      .from('goals')
      .insert({
        team_id: currentTeam.id,
        title,
        description,
        due_date,
        notes,
        show_notes,
        sort_order: maxRank,
        status: 'active',
        category_id: category_id || null
      })
      .select()
      .single()

    if (error) return { data: null, error }

    // Add assigned members
    if (assigned_members.length > 0) {
      await supabase
        .from('goal_members')
        .insert(assigned_members.map(userId => ({
          goal_id: data.id,
          user_id: userId
        })))
    }

    await fetchGoals()
    return { data, error: null }
  }

  async function updateGoal(id, updates) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setGoals(goals.map(g => g.id === id ? data : g))
    }
    return { data, error }
  }

  async function deleteGoal(id) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (!error) {
      setGoals(goals.filter(g => g.id !== id))
    }
    return { error }
  }

  async function updateGoalMembers(goalId, memberIds) {
    // Remove existing members
    await supabase
      .from('goal_members')
      .delete()
      .eq('goal_id', goalId)

    // Add new members
    if (memberIds.length > 0) {
      await supabase
        .from('goal_members')
        .insert(memberIds.map(userId => ({
          goal_id: goalId,
          user_id: userId
        })))
    }

    await fetchGoals()
  }

  async function reorderGoals(reorderedGoals) {
    // Update ranks in database
    const updates = reorderedGoals.map((goal, index) =>
      supabase
        .from('goals')
        .update({ sort_order: index })
        .eq('id', goal.id)
    )

    await Promise.all(updates)
    setGoals(reorderedGoals.map((g, i) => ({ ...g, sort_order: i })))
  }

  async function inviteMember(email) {
    if (!currentTeam) return { error: 'No team selected' }

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        team_id: currentTeam.id,
        email,
        invited_by: user.id,
        status: 'pending'
      })
      .select()
      .single()

    return { data, error }
  }

  async function createPlaceholderMember(displayName) {
    if (!currentTeam) return { error: 'No team selected' }

    try {
      // Create a placeholder profile with a unique fake email
      const placeholderId = crypto.randomUUID()
      const placeholderEmail = `placeholder-${placeholderId}@teamnotes.local`

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: placeholderId,
          email: placeholderEmail,
          display_name: displayName,
          password: '' // No password needed for placeholder
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating placeholder profile:', profileError)
        return { error: profileError }
      }

      // Add to team_members
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: currentTeam.id,
          user_id: placeholderId,
          role: 'member'
        })

      if (memberError) {
        console.error('Error adding placeholder to team:', memberError)
        return { error: memberError }
      }

      await fetchMembers()
      return { data: profile, error: null }
    } catch (err) {
      console.error('Error in createPlaceholderMember:', err)
      return { error: err }
    }
  }

  async function removeMember(userId) {
    if (!currentTeam) return { error: 'No team selected' }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', currentTeam.id)
      .eq('user_id', userId)

    if (!error) {
      setMembers(members.filter(m => m.id !== userId))
    }
    return { error }
  }

  const isLeader = membership?.role === 'leader'

  const value = {
    teams,
    currentTeam,
    membership,
    goals,
    members,
    categories,
    loading,
    isLeader,
    selectTeam,
    createTeam,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalMembers,
    reorderGoals,
    createCategory,
    updateCategory,
    deleteCategory,
    inviteMember,
    createPlaceholderMember,
    removeMember,
    refreshTeams: fetchTeams,
    refreshGoals: fetchGoals,
    refreshMembers: fetchMembers,
    refreshCategories: fetchCategories
  }

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  )
}
