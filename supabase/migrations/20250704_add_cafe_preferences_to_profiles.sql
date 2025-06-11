-- Add cafe_preferences column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cafe_preferences jsonb; 