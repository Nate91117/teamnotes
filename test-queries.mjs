import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zvjwbyujkajtvqbcisco.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2andieXVqa2FqdHZxYmNpc2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTUyMDgsImV4cCI6MjA4NTIzMTIwOH0.7QPHmgnrmKyz_k2ZQFGqnu38eXK2fuC0hnlq7diKv2s'
)

const userId = 'afdbb000-c621-4a56-ac15-1f834c23501e'
const teamId = 'a49b3dea-1938-4925-874f-f079247dc287'

async function simulateFetchTasks() {
  console.log('=== Simulating useTasks.fetchTasks() ===')

  const { data, error } = await supabase
    .from('tasks')
    .select('*, goals (id, title)')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) {
    console.log('QUERY ERROR:', error.message)
    return
  }
  console.log('Tasks fetched:', data.length)

  const taskIds = data.map(t => t.id)

  const [aRes, pRes] = await Promise.all([
    supabase.from('task_assignees').select('task_id, user_id').in('task_id', taskIds),
    supabase.from('task_personal_goal_links').select('task_id, personal_goal_id').in('task_id', taskIds)
  ])

  console.log('Assignees error:', aRes.error, '| count:', (aRes.data || []).length)
  console.log('PG Links error:', pRes.error, '| count:', (pRes.data || []).length)

  const am = {}
  ;(aRes.data || []).forEach(a => {
    if (!am[a.task_id]) am[a.task_id] = []
    am[a.task_id].push(a.user_id)
  })

  const pm = {}
  ;(pRes.data || []).forEach(l => {
    if (!pm[l.task_id]) pm[l.task_id] = []
    pm[l.task_id].push(l.personal_goal_id)
  })

  const final = data.map(t => ({
    ...t,
    assignees: am[t.id] || [],
    linked_personal_goal_ids: pm[t.id] || []
  }))

  console.log('\nAll tasks:')
  final.forEach(t => console.log(`  ${t.status.padEnd(12)} | ${t.title} | due: ${t.due_date || 'none'} | assignees: ${t.assignees.length} | pg_links: ${t.linked_personal_goal_ids.length}`))

  const visible = final.filter(t => t.status !== 'done')
  console.log('\nVisible (non-done):', visible.length, 'of', final.length)

  // Check for any data that might cause rendering issues
  final.forEach(t => {
    if (t.goals === undefined) console.log('  WARNING: goals is undefined for', t.title)
    if (typeof t.assignees !== 'object') console.log('  WARNING: assignees not array for', t.title)
    if (typeof t.linked_personal_goal_ids !== 'object') console.log('  WARNING: pg_links not array for', t.title)
  })
}

async function simulatePersonalGoals() {
  console.log('\n=== Simulating usePersonalGoals() ===')

  const { data, error } = await supabase
    .from('personal_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .eq('year', 2026)
    .order('sort_order', { ascending: true })

  if (error) {
    console.log('ERROR:', error.message)
    return
  }

  console.log('Personal goals:', data.length)

  for (const goal of data) {
    const { data: taskLinks, error: tlErr } = await supabase
      .from('task_personal_goal_links')
      .select('task_id')
      .eq('personal_goal_id', goal.id)

    if (tlErr) {
      console.log('  task_personal_goal_links ERROR:', tlErr.message)
      continue
    }

    const taskLinkIds = (taskLinks || []).map(l => l.task_id)
    console.log(`  ${goal.title}: ${taskLinkIds.length} task links`)

    if (taskLinkIds.length > 0) {
      const { data: tasksData, error: tErr } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, completed_at')
        .in('id', taskLinkIds)
      if (tErr) console.log('    tasks fetch ERROR:', tErr.message)
      else console.log(`    linked tasks: ${(tasksData || []).length}`)
    }
  }
}

async function checkTeamContext() {
  console.log('\n=== Checking TeamContext data ===')

  const { data: members } = await supabase
    .from('team_members')
    .select('profiles (id, display_name, email), role')
    .eq('team_id', teamId)

  console.log('Members:', JSON.stringify(members, null, 2))

  // Check if isLeader would be true
  const membership = members?.find(m => m.profiles?.id === userId)
  console.log('User membership:', membership)
  console.log('isLeader:', membership?.role === 'leader')
}

simulateFetchTasks()
  .then(() => simulatePersonalGoals())
  .then(() => checkTeamContext())
  .then(() => console.log('\n=== ALL DONE ==='))
  .catch(e => console.log('UNCAUGHT ERROR:', e))
