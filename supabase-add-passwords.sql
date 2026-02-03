-- Add password column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Set a default password for existing users (change this after logging in)
UPDATE profiles SET password = 'changeme' WHERE password IS NULL;
