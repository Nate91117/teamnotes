-- Schema updates for new features
-- Run this in Supabase SQL Editor

-- Add new columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS show_notes BOOLEAN DEFAULT false;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

-- Add notes and rank to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

-- Create goal_members junction table for linking goals to team members
CREATE TABLE IF NOT EXISTS goal_members (
  goal_id UUID REFERENCES goals ON DELETE CASCADE,
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (goal_id, user_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_goal_members_goal ON goal_members(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_members_user ON goal_members(user_id);

-- Enable RLS on goal_members
ALTER TABLE goal_members ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy for goal_members (allow all for authenticated/anon for now)
CREATE POLICY "Allow all goal_members operations"
  ON goal_members FOR ALL
  USING (true)
  WITH CHECK (true);
