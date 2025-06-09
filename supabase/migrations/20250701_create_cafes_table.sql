-- Canonical migration for cafes table (matches production schema)
CREATE TABLE IF NOT EXISTS cafes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  description text,
  tags text[],
  transport text[],
  price_bracket text,
  opening_hours jsonb,
  open_morning boolean,
  open_afternoon boolean,
  open_evening boolean,
  rating numeric,
  verified boolean DEFAULT FALSE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cafes_city_idx ON cafes(city);
CREATE INDEX IF NOT EXISTS cafes_tags_idx ON cafes USING GIN(tags);
CREATE INDEX IF NOT EXISTS cafes_verified_idx ON cafes(verified); 