-- Add a token column to the friend_requests table to allow unauthenticated access
ALTER TABLE public.friend_requests ADD COLUMN IF NOT EXISTS token TEXT;

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Request participants can view" ON public.friend_requests;

-- Create a new policy that allows unauthenticated access via token,
-- or authenticated access for participants.
CREATE POLICY "Request participants can view" ON public.friend_requests
  FOR SELECT USING (
    (EXISTS (
      SELECT 1
      FROM unnest(current_setting('request.jwt.claims', true)::jsonb -> 'token_list'::text) AS t(token_val)
      WHERE (t.token_val ->> 0) = token
    )) OR (
      (auth.role() = 'authenticated'::text) AND (auth.uid() IN (requester_id, addressee_id))
    )
  );
