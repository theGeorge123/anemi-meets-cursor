-- Atomic function to accept a friend invite and create a friendship
-- Usage: SELECT accept_friend_invite(invite_id, inviter_id, invitee_id);

CREATE OR REPLACE FUNCTION accept_friend_invite(
  invite_id UUID,
  inviter_id UUID,
  invitee_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update invite status
  UPDATE friend_invites 
    SET status = 'accepted' 
    WHERE id = invite_id;

  -- Create mutual friendship (single row, avoid duplicates)
  INSERT INTO friendships (user_id_1, user_id_2)
    VALUES (LEAST(inviter_id, invitee_id), GREATEST(inviter_id, invitee_id))
    ON CONFLICT (user_id_1, user_id_2) DO NOTHING;
END;
$$; 