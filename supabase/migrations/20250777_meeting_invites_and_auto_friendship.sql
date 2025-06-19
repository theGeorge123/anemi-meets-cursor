-- Create meeting_invites table for guest/authenticated meeting acceptance
CREATE TABLE IF NOT EXISTS meeting_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_email TEXT NOT NULL,
  meeting_id UUID NOT NULL REFERENCES meetings(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  UNIQUE(token)
);

-- Auto-friendship trigger: when a user signs up, create friendships for accepted invites
CREATE OR REPLACE FUNCTION auto_friendship_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO friendships (user_id_1, user_id_2)
  SELECT LEAST(NEW.id, inviter_id), GREATEST(NEW.id, inviter_id)
  FROM meeting_invites
  WHERE invitee_email = NEW.email
    AND status = 'accepted'
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Attach trigger to user signup
DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
CREATE TRIGGER on_user_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_friendship_on_signup(); 