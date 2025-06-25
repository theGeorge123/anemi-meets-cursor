ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
 
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invitations they created or received"
  ON invitations FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id OR email_b = (SELECT email FROM profiles WHERE id = auth.uid())); 