-- Personal goals table
CREATE TABLE personal_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  team_id UUID REFERENCES teams ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL DEFAULT 2026,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add personal goal linking to tasks
ALTER TABLE tasks ADD COLUMN linked_personal_goal_id UUID REFERENCES personal_goals ON DELETE SET NULL;

-- Junction table: team goals <-> personal goals (many-to-many)
CREATE TABLE goal_personal_goal_links (
  goal_id UUID REFERENCES goals ON DELETE CASCADE,
  personal_goal_id UUID REFERENCES personal_goals ON DELETE CASCADE,
  PRIMARY KEY (goal_id, personal_goal_id)
);

-- Indexes
CREATE INDEX idx_personal_goals_user_team ON personal_goals(user_id, team_id);
CREATE INDEX idx_personal_goals_year ON personal_goals(year);
CREATE INDEX idx_tasks_linked_personal_goal ON tasks(linked_personal_goal_id);
CREATE INDEX idx_goal_personal_goal_links_goal ON goal_personal_goal_links(goal_id);
CREATE INDEX idx_goal_personal_goal_links_personal ON goal_personal_goal_links(personal_goal_id);

-- RLS (permissive, matching existing pattern)
ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_personal_goal_links ENABLE ROW LEVEL SECURITY;

-- Personal goals: users can manage their own
CREATE POLICY "Users can view own personal goals"
  ON personal_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personal goals"
  ON personal_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal goals"
  ON personal_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal goals"
  ON personal_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Leaders can view personal goals of their team members
CREATE POLICY "Leaders can view team personal goals"
  ON personal_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = personal_goals.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'leader'
    )
  );

-- Goal-personal goal links: accessible to team members
CREATE POLICY "Team members can view goal links"
  ON goal_personal_goal_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM personal_goals pg
      JOIN team_members tm ON tm.team_id = pg.team_id
      WHERE pg.id = goal_personal_goal_links.personal_goal_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own goal links"
  ON goal_personal_goal_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personal_goals pg
      WHERE pg.id = goal_personal_goal_links.personal_goal_id
        AND pg.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own goal links"
  ON goal_personal_goal_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM personal_goals pg
      WHERE pg.id = goal_personal_goal_links.personal_goal_id
        AND pg.user_id = auth.uid()
    )
  );
