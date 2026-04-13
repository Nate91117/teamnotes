-- Add weekly recurrence columns to the tasks table
-- Run this against your Supabase database after deploying the weekly tasks feature.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_weekly BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS weekly_day INTEGER,          -- 0=Sunday, 1=Monday … 6=Saturday
  ADD COLUMN IF NOT EXISTS weekly_source_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS weekly_week TEXT;            -- YYYY-MM-DD of the week's Sunday

CREATE INDEX IF NOT EXISTS idx_tasks_weekly_source_id ON tasks(weekly_source_id);
CREATE INDEX IF NOT EXISTS idx_tasks_weekly_week ON tasks(weekly_week);
