-- Upgrade friend_invites table to best-practice schema
ALTER TABLE friend_invites
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');

-- If token is not UUID, convert to UUID (if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='friend_invites' AND column_name='token' AND data_type='uuid'
  ) THEN
    ALTER TABLE friend_invites ALTER COLUMN token TYPE uuid USING (token::uuid);
  END IF;
END$$;

-- Ensure token is unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE table_name='friend_invites' AND constraint_type='UNIQUE' AND constraint_name='friend_invites_token_key'
  ) THEN
    ALTER TABLE friend_invites ADD CONSTRAINT friend_invites_token_key UNIQUE (token);
  END IF;
END$$;

-- Set expires_at for existing rows if null
UPDATE friend_invites SET expires_at = now() + interval '7 days' WHERE expires_at IS NULL;

-- Set status for accepted invites
UPDATE friend_invites SET status = 'accepted' WHERE accepted = true;
UPDATE friend_invites SET status = 'pending' WHERE accepted = false AND status IS NULL;

-- Remove accepted/accepted_at columns if desired (optional, comment out if you want to keep)
-- ALTER TABLE friend_invites DROP COLUMN IF EXISTS accepted;
-- ALTER TABLE friend_invites DROP COLUMN IF EXISTS accepted_at;

-- Upgrade friendships table to single-row model
-- 1. Create new table if not exists
CREATE TABLE IF NOT EXISTS friendships_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES auth.users(id),
  user_id_2 UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 != user_id_2)
);

-- 2. Migrate existing friendships (two-way to single row)
INSERT INTO friendships_new (user_id_1, user_id_2, created_at)
SELECT DISTINCT LEAST(user_id, friend_id), GREATEST(user_id, friend_id), MIN(created_at)
FROM friendships
WHERE status = 'accepted'
GROUP BY LEAST(user_id, friend_id), GREATEST(user_id, friend_id);

-- 3. Drop old table and rename
DROP TABLE friendships;
ALTER TABLE friendships_new RENAME TO friendships;

-- 4. Add RLS policies for friend_invites
ALTER TABLE friend_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guest can accept invite by email and token" ON friend_invites;
DROP POLICY IF EXISTS "Anyone can view invite by token" ON friend_invites;

CREATE POLICY "Users can view their own invites" ON friend_invites
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = inviter_id OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can create invites" ON friend_invites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can update invite status" ON friend_invites
  FOR UPDATE TO authenticated
  USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status = 'pending'
  )
  WITH CHECK (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status IN ('accepted', 'rejected')
  );

-- 5. Add RLS policies for friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Request participants can view" ON friendships;
DROP POLICY IF EXISTS "Request participants can update" ON friendships;
DROP POLICY IF EXISTS "Request participants can delete" ON friendships;

CREATE POLICY "Users can view their own friendships" ON friendships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can delete their own friendships" ON friendships
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- End migration 