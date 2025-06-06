-- Track when reminder emails were sent to avoid duplicates
ALTER TABLE invitations
  ADD COLUMN reminded_24h timestamptz,
  ADD COLUMN reminded_1h timestamptz;
