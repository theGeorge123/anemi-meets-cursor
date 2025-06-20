-- First, we need to drop the existing policy.
DROP POLICY IF EXISTS "Allow users to read their invitations" ON public.invitations;

-- Then, we create a new policy that allows unauthenticated access
-- if the user is querying with a specific token, which is what the Respond.tsx page does.
-- For other queries, the user must be authenticated.
CREATE POLICY "Allow users to read their invitations" ON public.invitations
FOR SELECT USING (
  (EXISTS (
    SELECT 1
    FROM unnest(current_setting('request.jwt.claims', true)::jsonb -> 'token_list'::text) AS t(token_val)
    WHERE (t.token_val ->> 0) = token
  )) OR (
    (auth.role() = 'authenticated'::text) AND (
      (auth.uid() = invitee_id) OR
      (auth.email() = email_a) OR
      (auth.email() = email_b)
    )
  )
);
