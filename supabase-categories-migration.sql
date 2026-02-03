-- Step 1: Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add category_id column to goals
ALTER TABLE goals ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories ON DELETE SET NULL;

-- Step 3: For each team, create the 3 default categories and migrate existing goals
-- This needs to be run as a function to handle dynamic team IDs

DO $$
DECLARE
  team_record RECORD;
  cat1_id UUID;
  cat2_id UUID;
  cat3_id UUID;
BEGIN
  -- Loop through each team
  FOR team_record IN SELECT id FROM teams LOOP
    -- Create the 3 categories for this team
    INSERT INTO categories (team_id, name, color, sort_order)
    VALUES (team_record.id, 'All Positions Build', 'indigo', 0)
    RETURNING id INTO cat1_id;

    INSERT INTO categories (team_id, name, color, sort_order)
    VALUES (team_record.id, 'Maintenance', 'orange', 1)
    RETURNING id INTO cat2_id;

    INSERT INTO categories (team_id, name, color, sort_order)
    VALUES (team_record.id, 'Bolt-on Analytics', 'cyan', 2)
    RETURNING id INTO cat3_id;

    -- Migrate existing goals to use category_id
    UPDATE goals SET category_id = cat1_id
    WHERE team_id = team_record.id AND category = 'all positions build';

    UPDATE goals SET category_id = cat2_id
    WHERE team_id = team_record.id AND category = 'maintenance';

    UPDATE goals SET category_id = cat3_id
    WHERE team_id = team_record.id AND category = 'bolt-on analytics';
  END LOOP;
END $$;

-- Step 4: Add linked_task_id to notes (for linking notes to tasks)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES tasks ON DELETE SET NULL;
