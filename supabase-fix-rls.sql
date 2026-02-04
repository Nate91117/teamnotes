-- Fix RLS policies for password-based auth (not using Supabase Auth)
-- Drop all auth.uid() based policies and replace with allow-all

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles of team members" ON profiles;
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- Teams
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Leaders can update their teams" ON teams;
CREATE POLICY "Allow all on teams" ON teams FOR ALL USING (true) WITH CHECK (true);

-- Team members
DROP POLICY IF EXISTS "Users can view members of their teams" ON team_members;
DROP POLICY IF EXISTS "Leaders can add members" ON team_members;
DROP POLICY IF EXISTS "Leaders can remove members" ON team_members;
CREATE POLICY "Allow all on team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);

-- Goals
DROP POLICY IF EXISTS "Users can view goals in their teams" ON goals;
DROP POLICY IF EXISTS "Leaders can create goals" ON goals;
DROP POLICY IF EXISTS "Leaders can update goals" ON goals;
DROP POLICY IF EXISTS "Leaders can delete goals" ON goals;
CREATE POLICY "Allow all on goals" ON goals FOR ALL USING (true) WITH CHECK (true);

-- Notes
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
DROP POLICY IF EXISTS "Leaders can view shared notes in their teams" ON notes;
CREATE POLICY "Allow all on notes" ON notes FOR ALL USING (true) WITH CHECK (true);

-- Tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Leaders can view shared tasks in their teams" ON tasks;
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- Invitations
DROP POLICY IF EXISTS "Leaders can view invitations for their teams" ON invitations;
DROP POLICY IF EXISTS "Leaders can create invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
CREATE POLICY "Allow all on invitations" ON invitations FOR ALL USING (true) WITH CHECK (true);

-- Categories (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    EXECUTE 'CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true)';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
