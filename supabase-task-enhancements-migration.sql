-- Task assignees junction table (multiple members per task)
CREATE TABLE task_assignees (
  task_id UUID REFERENCES tasks ON DELETE CASCADE,
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- Task <-> personal goals junction table (many-to-many, replacing linked_personal_goal_id FK)
CREATE TABLE task_personal_goal_links (
  task_id UUID REFERENCES tasks ON DELETE CASCADE,
  personal_goal_id UUID REFERENCES personal_goals ON DELETE CASCADE,
  PRIMARY KEY (task_id, personal_goal_id)
);

-- Track when tasks are completed
ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing linked_personal_goal_id data to junction table
INSERT INTO task_personal_goal_links (task_id, personal_goal_id)
SELECT id, linked_personal_goal_id FROM tasks
WHERE linked_personal_goal_id IS NOT NULL;

-- Indexes
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_task_personal_goal_links_task ON task_personal_goal_links(task_id);
CREATE INDEX idx_task_personal_goal_links_pg ON task_personal_goal_links(personal_goal_id);

-- RLS (permissive, matching existing "allow all" pattern)
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_personal_goal_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on task_assignees" ON task_assignees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on task_personal_goal_links" ON task_personal_goal_links FOR ALL USING (true) WITH CHECK (true);

-- Also fix personal_goals and goal_personal_goal_links to match existing allow-all pattern
DROP POLICY IF EXISTS "Users can view own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can insert own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can update own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can delete own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Leaders can view team personal goals" ON personal_goals;
CREATE POLICY "Allow all on personal_goals" ON personal_goals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Team members can view goal links" ON goal_personal_goal_links;
DROP POLICY IF EXISTS "Users can manage own goal links" ON goal_personal_goal_links;
DROP POLICY IF EXISTS "Users can delete own goal links" ON goal_personal_goal_links;
CREATE POLICY "Allow all on goal_personal_goal_links" ON goal_personal_goal_links FOR ALL USING (true) WITH CHECK (true);
