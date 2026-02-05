# TeamNotes

A React-based team collaboration app with Supabase backend for managing team goals, personal tasks, notes, and personal goals with cross-linking between items.

## Features

### Team Leader
- **Project Dashboard** - Overview of all team goals organized by category
- **Goal Management** - Create, edit, delete, and categorize team goals with due dates
- **Member Assignment** - Assign goals and tasks to specific team members
- **Members View** - See all shared tasks and notes per team member
- **Team Management** - Invite members via email, view/manage team roster
- **Category System** - Color-coded goal categories for organization

### Team Member
- **Personal Tasks** - Kanban board (To Do / In Progress / Done) and list views with inline editing
- **Task Features** - Due dates, multi-assignee support, link to team goals and personal goals, share to dashboard
- **Personal Notes** - Create and manage notes, link to tasks, share to dashboard
- **Personal Goals** - Year-based personal goals linked to team goals and tasks with progress tracking
- **Share to Dashboard** - Toggle items visible on the team leader's dashboard

### General
- **Dark Mode** - Full dark mode support across all components
- **Responsive Design** - Works on desktop and mobile
- **Real-time Updates** - Live data sync via Supabase subscriptions
- **Settings** - Account management, password changes, preferences

## Tech Stack

- **Frontend**: React 18 + Vite + React Router 6
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS 3 (class-based dark mode)
- **State Management**: React Context + Custom Hooks + Supabase subscriptions
- **Deployment**: GitHub Pages via GitHub Actions

## Getting Started

### 1. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API and copy your:
   - Project URL
   - Anon/Public key

### 2. Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Set Up Database

Run the SQL migration files in your Supabase SQL Editor in this order:
1. `supabase-schema.sql` - Base tables, indexes, and RLS policies
2. `supabase-categories-migration.sql` - Categories for goal organization
3. `supabase-personal-goals-migration.sql` - Personal goals feature
4. `supabase-task-enhancements-migration.sql` - Multi-assignee tasks, personal goal links, inline editing

### 4. Install and Run

```bash
npm install   # Install dependencies
npm run dev   # Start dev server at http://localhost:3000
```

## Project Structure

```
teamnotes/
├── src/
│   ├── components/
│   │   ├── auth/          # LoginForm, SignupForm, ProtectedRoute
│   │   ├── common/        # Button, Modal, LoadingSpinner, Layout
│   │   ├── dashboard/     # LeaderDashboard, MemberDashboard, MemberViewDashboard, GoalCard
│   │   ├── notes/         # NotesList, NoteEditor, NoteCard
│   │   ├── tasks/         # TasksList, TaskEditor, TaskCard
│   │   ├── goals/         # PersonalGoalsList, PersonalGoalCard, PersonalGoalEditor
│   │   ├── team/          # TeamSettings, MemberList, InviteMember
│   │   └── settings/      # AccountSettings, SecuritySettings, PreferenceSettings
│   ├── contexts/
│   │   ├── AuthContext.jsx    # Authentication state & methods
│   │   └── TeamContext.jsx    # Team, goals, members, categories state
│   ├── hooks/
│   │   ├── useNotes.js        # Notes CRUD operations
│   │   ├── useTasks.js        # Tasks CRUD with multi-assignee & goal links
│   │   ├── usePersonalGoals.js # Personal goals with year filtering
│   │   └── useTeam.js         # Team context wrapper
│   ├── lib/
│   │   └── supabase.js    # Supabase client
│   ├── pages/
│   │   ├── Login.jsx, Signup.jsx
│   │   ├── Dashboard.jsx      # Routes to Leader or Member dashboard
│   │   ├── MyTasks.jsx        # Tasks page with error boundary
│   │   ├── MyNotes.jsx        # Notes page
│   │   ├── PersonalGoals.jsx  # Personal goals page
│   │   ├── TeamSettings.jsx   # Team management (leader only)
│   │   └── Settings.jsx       # Account settings
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css          # Tailwind imports + custom component styles
├── .github/workflows/
│   └── deploy.yml         # GitHub Actions deployment pipeline
├── supabase-schema.sql                    # Base database schema
├── supabase-categories-migration.sql      # Categories migration
├── supabase-personal-goals-migration.sql  # Personal goals migration
├── supabase-task-enhancements-migration.sql # Task enhancements migration
├── supabase-fix-rls.sql                   # RLS policy fixes
├── CLAUDE.md              # AI assistant project context
├── .env.example           # Environment template
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## User Flows

### Sign Up / Join Flow
1. User enters email + password on signup page
2. Profile created in database
3. If pending invitation exists for that email: auto-joins team as member
4. If no invitation: can create a new team (becomes leader)

### Task Workflow
1. Member creates task with title, description, due date
2. Optionally links to team goal and/or personal goals
3. Leader can assign tasks to multiple team members
4. Status progression: To Do → In Progress → Done
5. Toggle "Share to Dashboard" to make visible on leader's view

### Goal Linking
1. Leader creates team goals, optionally assigns categories and members
2. Members create personal goals for the year
3. Members link personal goals to team goals
4. Members link tasks to both team goals and personal goals
5. Leader sees linked/shared items on the dashboard

## Development

```bash
npm run dev       # Development server (port 3000, auto-opens browser)
npm run build     # Production build to ./dist
npm run preview   # Preview production build
```

### Deployment
Push to `master` triggers automatic deployment to GitHub Pages via GitHub Actions.

## License

MIT
