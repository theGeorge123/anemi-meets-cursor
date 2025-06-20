-- Atomic function to accept a friend invite and create a friendship
-- Usage: SELECT accept_friend_invite(invite_id, inviter_id, invitee_id);

CREATE OR REPLACE FUNCTION accept_friend_invite(
  invite_id UUID,
  inviter_id UUID,
  invitee_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  friendship_id UUID;
BEGIN
  -- Update invite status atomically
  UPDATE friend_invites 
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE id = invite_id
      AND status = 'pending'
      AND expires_at > NOW()
    RETURNING id INTO invite_id;

  IF invite_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invite not found or already processed'
    );
  END IF;

  -- Create mutual friendship (single row, avoid duplicates)
  INSERT INTO friendships (user_id_1, user_id_2)
    VALUES (LEAST(inviter_id, invitee_id), GREATEST(inviter_id, invitee_id))
    ON CONFLICT (user_id_1, user_id_2) DO NOTHING
    RETURNING id INTO friendship_id;

  RETURN jsonb_build_object(
    'success', true,
    'friendship_created', friendship_id IS NOT NULL
  );
END;
$$; 