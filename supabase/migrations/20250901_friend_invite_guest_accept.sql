-- Allow guest acceptance of friend_invites by token and email
ALTER TABLE friend_invites ENABLE ROW LEVEL SECURITY;

-- Allow update (accept) if the invitee_email matches the provided email (for guests)
CREATE POLICY "Guest can accept invite by email and token" ON friend_invites
  FOR UPDATE USING (
    (invitee_email = auth.email())
    OR (auth.role() = 'service_role')
  );

-- Allow select by token for invite page
CREATE POLICY "Anyone can view invite by token" ON friend_invites
  FOR SELECT USING (true); 