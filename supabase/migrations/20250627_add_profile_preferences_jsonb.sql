-- Add a JSONB column for user preferences (tags, price, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb; 