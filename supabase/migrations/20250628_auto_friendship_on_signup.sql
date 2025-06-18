-- Auto-friendship on signup via invite
-- This trigger will check for a pending friend_invite for the new user's email and create a friendship if found

CREATE OR REPLACE FUNCTION public.auto_friendship_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  invite_id uuid;
  inviter_id uuid;
BEGIN
  -- Find a pending invite for this email
  SELECT id, inviter_id INTO invite_id, inviter_id
  FROM friend_invites
  WHERE invitee_email = NEW.email AND accepted = false
  LIMIT 1;

  IF invite_id IS NOT NULL AND inviter_id IS NOT NULL THEN
    -- Create friendship in both directions if not already present
    INSERT INTO friendships (user_id, friend_id, status)
      VALUES (inviter_id, NEW.id, 'accepted')
      ON CONFLICT (user_id, friend_id) DO NOTHING;
    INSERT INTO friendships (user_id, friend_id, status)
      VALUES (NEW.id, inviter_id, 'accepted')
      ON CONFLICT (user_id, friend_id) DO NOTHING;
    -- Mark invite as accepted
    UPDATE friend_invites SET accepted = true, accepted_at = NOW() WHERE id = invite_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_friendship_on_signup_trigger ON public.profiles;
CREATE TRIGGER auto_friendship_on_signup_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_friendship_on_signup(); 