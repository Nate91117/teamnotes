# TeamNotes

A React-based team collaboration app with Supabase backend for managing team goals, personal tasks, notes, and personal goals with cross-linking between items.

## Features

### Team Leader
- **Project Dashboard** - Overview of all team goals organized by category, with "+ New Task" to create a task inline
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

## Architecture

See `CLAUDE.md` for the full architecture reference (directory layout, state management, database schema, code patterns, routes, and known technical debt).

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
