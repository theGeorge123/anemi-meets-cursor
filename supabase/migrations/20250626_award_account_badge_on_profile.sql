-- Award 'account' badge to every new user upon profile creation

-- 1. Create the function
CREATE OR REPLACE FUNCTION public.award_account_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award if not already present (shouldn't happen, but safe)
  IF NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = NEW.id AND badge_key = 'account'
  ) THEN
    INSERT INTO user_badges (user_id, badge_key) VALUES (NEW.id, 'account');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on profiles
DROP TRIGGER IF EXISTS award_account_badge_trigger ON public.profiles;
CREATE TRIGGER award_account_badge_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.award_account_badge(); 