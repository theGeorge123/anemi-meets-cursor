-- Add the is_beta_user column to the profiles table
ALTER TABLE "public"."profiles"
ADD COLUMN "is_beta_user" BOOLEAN DEFAULT FALSE NOT NULL;

-- Backfill the is_beta_user flag for existing users who have been accepted to the beta
UPDATE public.profiles p
SET is_beta_user = TRUE
FROM public.beta_signups b
WHERE p.email = b.email AND b.status = 'accepted';

-- This function runs when a new user signs up.
-- We are updating it to check if the new user's email is in the beta_signups table with an 'accepted' status.
-- If it is, we set the is_beta_user flag on their new profile to true.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_accepted BOOLEAN;
BEGIN
  -- Check if the user's email has been accepted in the beta program
  SELECT status = 'accepted' INTO is_accepted FROM public.beta_signups WHERE email = new.email;

  -- Insert the new user's profile
  INSERT INTO public.profiles (id, email, is_beta_user)
  VALUES (new.id, new.email, COALESCE(is_accepted, false));

  RETURN new;
END;
$$; 