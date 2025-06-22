
-- Part 2: Functions

CREATE OR REPLACE FUNCTION "public"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

CREATE OR REPLACE FUNCTION "public"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

CREATE OR REPLACE FUNCTION "public"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION "public"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;

CREATE OR REPLACE FUNCTION public.add_beta_user_flag() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE public.profiles
  SET is_beta_user = true
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_badge(badge_id_to_award character varying) RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profile_badges WHERE profile_id = NEW.id AND badge_id = badge_id_to_award) THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.profile_badges (profile_id, badge_id)
  VALUES (NEW.id, badge_id_to_award);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_friendship_on_request_accept() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO public.friendships (user1_id, user2_id)
        VALUES (NEW.sender_id, NEW.receiver_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;