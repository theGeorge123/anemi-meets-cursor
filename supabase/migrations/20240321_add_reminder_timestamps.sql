-- Track when reminder emails were sent. NULL means the reminder hasn't been sent yet.
ALTER TABLE invitations
  ADD COLUMN reminded_24h timestamptz,
  ADD COLUMN reminded_1h timestamptz;
