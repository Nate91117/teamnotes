-- TeamNotes Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  leader_id UUID REFERENCES profiles ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team membership
CREATE TABLE team_members (
  team_id UUID REFERENCES teams ON DELETE CASCADE,
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Team goals (leader creates these)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  team_id UUID REFERENCES teams ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  linked_goal_id UUID REFERENCES goals ON DELETE SET NULL,
  shared_to_dashboard BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  team_id UUID REFERENCES teams ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  linked_goal_id UUID REFERENCES goals ON DELETE SET NULL,
  shared_to_dashboard BOOLEAN DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invitations (for adding team members via email)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES profiles ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_goals_team ON goals(team_id);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_team ON notes(team_id);
CREATE INDEX idx_notes_goal ON notes(linked_goal_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_team ON tasks(team_id);
CREATE INDEX idx_tasks_goal ON tasks(linked_goal_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_team ON invitations(team_id);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view profiles of team members"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT tm.user_id FROM team_members tm
      WHERE tm.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Teams policies
CREATE POLICY "Users can view teams they belong to"
  ON teams FOR SELECT
  USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leaders can update their teams"
  ON teams FOR UPDATE
  USING (leader_id = auth.uid());

-- Team members policies
CREATE POLICY "Users can view members of their teams"
  ON team_members FOR SELECT
  USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Leaders can add members"
  ON team_members FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE leader_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Leaders can remove members"
  ON team_members FOR DELETE
  USING (
    team_id IN (SELECT id FROM teams WHERE leader_id = auth.uid())
  );

-- Goals policies
CREATE POLICY "Users can view goals in their teams"
  ON goals FOR SELECT
  USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Leaders can create goals"
  ON goals FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE leader_id = auth.uid())
  );

CREATE POLICY "Leaders can update goals"
  ON goals FOR UPDATE
  USING (
    team_id IN (SELECT id FROM teams WHERE leader_id = auth.uid())
  );

CREATE POLICY "Leaders can delete goals"
  ON goals FOR DELETE
  USING (
    team_id IN (SELECT id FROM teams WHERE leader_id = auth.uid())
  );

-- Notes policies
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own notes"
  ON notes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Leaders can view shared notes in their teams"
  ON notes FOR SELECT
  USING (
    shared_to_dashboard = true
    AND team_id IN (SELECT id FROM teams WHERE leader_id = auth.uid())
  );

-- Tasks policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Leaders can view shared tasks in their teams"
  ON tasks FOR SELECT
  USING (
    shared_to_dashboard = true
    AND team_id IN (SELECT id FROM teams WHERE leader_id = auth.uid())
  );

-- Invitations policies
CREATE POLICY "Leaders can view invitations for their teams"
  ON invitations FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams WHERE leader_id = auth.uid())
  );

CREATE POLICY "Leaders can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE leader_id = auth.uid())
  );

CREATE POLICY "Users can view their own invitations"
  ON invitations FOR SELECT
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Function to handle new user signup and check for invitations
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  pending_invitation RECORD;
BEGIN
  -- Insert profile
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));

  -- Check for pending invitations and add user to teams
  FOR pending_invitation IN
    SELECT * FROM invitations WHERE email = NEW.email AND status = 'pending'
  LOOP
    -- Add user to team
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (pending_invitation.team_id, NEW.id, 'member');

    -- Update invitation status
    UPDATE invitations SET status = 'accepted' WHERE id = pending_invitation.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
