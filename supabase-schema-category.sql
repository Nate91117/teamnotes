-- Add category column to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('all positions build', 'maintenance', 'bolt-on analytics'));

-- Add category column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('all positions build', 'maintenance', 'bolt-on analytics'));
