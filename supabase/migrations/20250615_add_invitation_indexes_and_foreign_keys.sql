-- Add indexes to optimize invitation lookups
CREATE INDEX IF NOT EXISTS invitations_token_idx ON invitations(token);
CREATE INDEX IF NOT EXISTS invitations_selected_date_idx ON invitations(selected_date);
CREATE INDEX IF NOT EXISTS invitations_email_a_idx ON invitations(email_a);
CREATE INDEX IF NOT EXISTS invitations_email_b_idx ON invitations(email_b);

-- Ensure cafe references exist
ALTER TABLE invitations
  ADD CONSTRAINT invitations_cafe_id_fkey
  FOREIGN KEY (cafe_id) REFERENCES cafes(id);

-- Link various tables to the users table
ALTER TABLE friend_invites
  ADD CONSTRAINT friend_invites_inviter_id_fkey
  FOREIGN KEY (inviter_id) REFERENCES auth.users(id);

ALTER TABLE friendships
  ADD CONSTRAINT friendships_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE friendships
  ADD CONSTRAINT friendships_friend_id_fkey
  FOREIGN KEY (friend_id) REFERENCES auth.users(id);

ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users(id);
ALTER TABLE messages
  ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES auth.users(id);

ALTER TABLE events
  ADD CONSTRAINT events_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE event_participants
  ADD CONSTRAINT event_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE communities
  ADD CONSTRAINT communities_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE community_members
  ADD CONSTRAINT community_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id);
