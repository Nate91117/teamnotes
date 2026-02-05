# TeamNotes - Claude Code Project Context

## Documentation Maintenance Rule
**IMPORTANT:** When committing changes that add features, modify architecture, change the database schema, or alter the project structure, you MUST also update this file (CLAUDE.md) and README.md to reflect those changes before committing. Keep both files accurate and current.

## Quick Start
```bash
npm install    # Install dependencies
npm run dev    # Dev server at http://localhost:3000
npm run build  # Production build to ./dist
```

## What This App Is
A team collaboration app where **leaders** create team goals and **members** manage personal tasks, notes, and personal goals that can link to team goals. Built with React 18 + Vite + Supabase (PostgreSQL) + Tailwind CSS. Deployed to GitHub Pages via GitHub Actions on push to `master`.

## Architecture Overview

### Stack
- **Frontend:** React 18, React Router 6, Tailwind CSS 3, Vite 5
- **Backend:** Supabase (PostgreSQL + Auth + Realtime subscriptions)
- **Deployment:** GitHub Pages via GitHub Actions (`master` branch)

### State Management (React Context + Custom Hooks)
```
BrowserRouter (basename="/teamnotes")
  AuthProvider (user session, profile, auth methods)
    TeamProvider (teams, goals, members, categories)
      Pages → use hooks: useTasks(), useNotes(), usePersonalGoals()
```

### Key Directories
```
src/
  components/
    auth/       - LoginForm, SignupForm, ProtectedRoute
    common/     - Layout, Button, Modal, LoadingSpinner
    dashboard/  - LeaderDashboard (610 lines), MemberDashboard, MemberViewDashboard, GoalCard
    tasks/      - TasksList (kanban+list views), TaskCard, TaskEditor
    notes/      - NotesList, NoteCard, NoteEditor
    goals/      - PersonalGoalsList, PersonalGoalCard, PersonalGoalEditor
    team/       - TeamSettings, MemberList, InviteMember
    settings/   - AccountSettings, SecuritySettings, PreferenceSettings
  contexts/
    AuthContext.jsx  - Auth state, signIn/signUp/signOut, profile management
    TeamContext.jsx  - Teams, goals, members, categories, realtime subscriptions
  hooks/
    useTasks.js          - Tasks CRUD, multi-assignee, personal goal links
    useNotes.js          - Notes CRUD, task linking
    usePersonalGoals.js  - Personal goals CRUD, year filtering, task/goal links
    useTeam.js           - Wrapper for TeamContext
  pages/
    Login.jsx, Signup.jsx, Dashboard.jsx, MyTasks.jsx,
    MyNotes.jsx, PersonalGoals.jsx, TeamSettings.jsx, Settings.jsx
  lib/
    supabase.js  - Supabase client initialization
```

### Routes (App.jsx)
- `/login`, `/signup` - Public
- `/dashboard` - LeaderDashboard or MemberDashboard based on role
- `/tasks`, `/notes`, `/personal-goals` - Member workspace
- `/team` - Leader-only team management
- `/settings` - Account/security/preferences
- `*` - Redirects to `/dashboard`

## Database Schema (Supabase)

### Core Tables
- **profiles** - User accounts (id, email, display_name, password)
- **teams** - Team containers (name, leader_id)
- **team_members** - Membership junction (team_id, user_id, role: leader|member)
- **goals** - Team goals (title, description, status, due_date, category_id, sort_order, notes, show_notes)
- **tasks** - User tasks (title, description, status: todo|in_progress|done, due_date, linked_goal_id, shared_to_dashboard, notes, sort_order, completed_at)
- **notes** - User notes (title, content, linked_goal_id, shared_to_dashboard)
- **personal_goals** - Personal goals (title, description, status, year, sort_order)
- **categories** - Goal categories (name, color, sort_order)
- **invitations** - Email invites (email, team_id, status: pending|accepted)

### Junction Tables (Many-to-Many)
- **task_assignees** (task_id, user_id)
- **goal_members** (goal_id, user_id)
- **task_personal_goal_links** (task_id, personal_goal_id)
- **goal_personal_goal_links** (goal_id, personal_goal_id)

### SQL Migration Files
- `supabase-schema.sql` - Base schema
- `supabase-categories-migration.sql` - Categories feature
- `supabase-personal-goals-migration.sql` - Personal goals feature
- `supabase-task-enhancements-migration.sql` - Task improvements
- `supabase-fix-rls.sql` - Row Level Security fixes

## Code Patterns & Conventions

### Data Fetching Pattern (Custom Hooks)
```javascript
// 1. Main query with joins
const { data } = await supabase.from('table').select('*, related (id, title)')...
// 2. Batch fetch junction table records
const [assignees, links] = await Promise.all([...])
// 3. Build maps, attach to records
// 4. Set state
```

### Many-to-Many Updates (Replace-All Pattern)
```javascript
// Delete existing junction records, then insert new ones
await supabase.from('junction').delete().eq('main_id', id)
await supabase.from('junction').insert(newIds.map(...))
```

### Form Handling
- Controlled components with useState
- `saving` boolean for button disable/loading text
- `error` state for inline error display
- `e.preventDefault()` on submit

### Styling
- Tailwind CSS with custom component layer (`.btn`, `.card`, `.badge`, `.input`)
- Dark mode via `class` strategy (`dark:` prefix)
- Primary color: blue scale (primary-50 through primary-900)
- Responsive: `md:grid-cols-2`, `md:grid-cols-3` patterns

### Roles
- **Leader** (`isLeader` from TeamContext): Can manage goals, categories, members, see all shared items
- **Member**: Can manage own tasks/notes/personal goals, share items to dashboard

## Known Issues & Technical Debt
- Auth uses plaintext passwords (not Supabase Auth) - stored in profiles table
- Supabase credentials hardcoded in `src/lib/supabase.js` (anon key is public, but still)
- N+1 queries in `usePersonalGoals` (fetches task links per goal)
- `LeaderDashboard.jsx` is 610 lines - could be split
- No test coverage
- Console.log debugging statements remain in TeamContext and some hooks
- `test-queries.mjs` at project root is a debug script (not production code)

## Deployment
- Push to `master` triggers `.github/workflows/deploy.yml`
- Builds with Node 20, injects Supabase vars from GitHub Secrets
- Deploys to GitHub Pages at `/teamnotes/` base path
