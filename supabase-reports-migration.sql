-- Reports table: simple items with a title assigned to a team member
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_team_id ON reports(team_id);
CREATE INDEX idx_reports_assigned_user_id ON reports(assigned_user_id);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Team members can view reports for their team
CREATE POLICY "Team members can view reports"
  ON reports FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can insert reports for their team
CREATE POLICY "Team members can insert reports"
  ON reports FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can update reports for their team
CREATE POLICY "Team members can update reports"
  ON reports FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can delete reports for their team
CREATE POLICY "Team members can delete reports"
  ON reports FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );
