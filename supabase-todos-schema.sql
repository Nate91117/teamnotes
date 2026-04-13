-- Run this in your Supabase SQL editor to create the To-Do Lists tables

CREATE TABLE IF NOT EXISTS todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  team_id UUID NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES todo_lists(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  team_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,          -- stored as YYYY-MM-DD, returned as YYYY-MM-DD string
  sort_order INTEGER DEFAULT 0,

  -- Weekly recurrence
  -- Template:  is_weekly=true,  weekly_source_id=null  (the blueprint)
  -- Instance:  is_weekly=true,  weekly_source_id=<template_id>, weekly_week=<sunday-date>
  is_weekly BOOLEAN DEFAULT FALSE,
  weekly_day INTEGER,             -- 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  weekly_source_id UUID REFERENCES todo_items(id) ON DELETE CASCADE,
  weekly_week TEXT,               -- YYYY-MM-DD of the Sunday that starts that week

  -- Monthly recurrence (mirrors existing tasks pattern)
  -- Template:  is_monthly=true, monthly_source_id=null
  -- Instance:  is_monthly=true, monthly_source_id=<template_id>, monthly_month=YYYY-MM
  is_monthly BOOLEAN DEFAULT FALSE,
  monthly_source_id UUID REFERENCES todo_items(id) ON DELETE CASCADE,
  monthly_month TEXT,             -- YYYY-MM

  created_at TIMESTAMPTZ DEFAULT NOW()
);
