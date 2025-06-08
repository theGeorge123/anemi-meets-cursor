-- Create cafe_analytics table for tracking cafe selections and skips
CREATE TABLE IF NOT EXISTS cafe_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  cafe_id uuid NOT NULL,
  action text NOT NULL, -- 'selected', 'skipped'
  created_at timestamp with time zone DEFAULT now(),
  session_id text
);
CREATE INDEX IF NOT EXISTS cafe_analytics_cafe_id_idx ON cafe_analytics(cafe_id);
CREATE INDEX IF NOT EXISTS cafe_analytics_user_id_idx ON cafe_analytics(user_id); 