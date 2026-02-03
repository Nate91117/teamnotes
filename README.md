# TeamNotes

A React-based team collaboration app with Supabase backend featuring team goals, personal notes/tasks, and linking between member items and team goals.

## Features

### Team Leader
- **Project Dashboard** - Overview of all team goals with linked items
- **Goal Management** - Create, edit, delete team goals
- **Team Management** - Invite members via email, view team roster
- **Linked Items View** - See all notes/tasks linked to each goal

### Team Member
- **Personal Workspace** - Own notes and tasks space
- **Note Creation** - Notes with optional goal linking
- **Task Management** - Personal tasks with status tracking (To Do, In Progress, Done)
- **Share to Dashboard** - Toggle to show items on team dashboard

## Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Supabase subscriptions

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

1. Go to your Supabase project's SQL Editor
2. Copy the contents of `supabase-schema.sql`
3. Run the SQL to create all tables, indexes, and policies

### 4. Configure Authentication

1. In Supabase Dashboard, go to Authentication > Providers
2. Ensure Email provider is enabled
3. Enable "Confirm email" (optional, but recommended)
4. Configure the Site URL in Authentication > URL Configuration:
   - Site URL: `http://localhost:3000` (for development)
   - Redirect URLs: `http://localhost:3000/dashboard`

### 5. Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
teamnotes/
├── src/
│   ├── components/
│   │   ├── common/        # Button, Modal, LoadingSpinner, Layout
│   │   ├── auth/          # LoginForm, ProtectedRoute
│   │   ├── dashboard/     # LeaderDashboard, MemberDashboard, GoalCard
│   │   ├── notes/         # NotesList, NoteEditor, NoteCard
│   │   ├── tasks/         # TasksList, TaskEditor, TaskCard
│   │   └── team/          # TeamSettings, MemberList, InviteMember
│   ├── contexts/
│   │   ├── AuthContext.jsx    # Authentication state
│   │   └── TeamContext.jsx    # Team and goals state
│   ├── hooks/
│   │   ├── useNotes.js    # Notes CRUD operations
│   │   ├── useTasks.js    # Tasks CRUD operations
│   │   └── useTeam.js     # Team context hook
│   ├── lib/
│   │   └── supabase.js    # Supabase client
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── MyNotes.jsx
│   │   ├── MyTasks.jsx
│   │   └── TeamSettings.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase-schema.sql    # Database setup script
├── .env.example           # Environment template
└── package.json
```

## User Flows

### Sign Up / Join Flow
1. User enters email on login page
2. Magic link sent to email (no password needed)
3. Click link to authenticate
4. If invited: automatically added to team
5. If new: option to create team (become leader) or wait for invitation

### Linking Flow
1. Member creates note or task
2. Can optionally link to existing team goal (dropdown)
3. Can toggle "Share to Dashboard"
4. Linked items appear on leader's goal detail view

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT
