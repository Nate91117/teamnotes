-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remove the CHECK constraint from goals.category and change to category_id
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_category_check;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories ON DELETE SET NULL;

-- Remove the CHECK constraint from tasks.category and change to category_id
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories ON DELETE SET NULL;

-- Change notes to link to tasks instead of goals
ALTER TABLE notes ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES tasks ON DELETE SET NULL;
