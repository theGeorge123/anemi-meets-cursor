ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their invitations" ON invitations
FOR SELECT USING (
  auth.uid() = invitee_id
  OR auth.email() = email_a
  OR auth.email() = email_b
);

CREATE POLICY "Allow users to insert invitations for themselves" ON invitations
FOR INSERT WITH CHECK (
  auth.email() = email_a
);

CREATE POLICY "Allow users to update their invitations" ON invitations
FOR UPDATE USING (
  auth.uid() = invitee_id
  OR auth.email() = email_a
  OR auth.email() = email_b
);

CREATE POLICY "Allow users to delete their invitations" ON invitations
FOR DELETE USING (
  auth.email() = email_a
);
