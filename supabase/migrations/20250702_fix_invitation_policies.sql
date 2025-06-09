-- Enable RLS if not already enabled
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own invitations (token, email, or user id match)
CREATE POLICY "Allow users to read their invitations" ON invitations
FOR SELECT USING (
  auth.uid() = invitee_id
  OR auth.email() = email_a
  OR auth.email() = email_b
);

-- Allow users to insert invitations for themselves
CREATE POLICY "Allow users to insert invitations for themselves" ON invitations
FOR INSERT WITH CHECK (
  auth.email() = email_a
); 