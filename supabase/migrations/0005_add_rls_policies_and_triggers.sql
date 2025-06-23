ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to badges" ON public.badges FOR SELECT USING (true);

ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin read access" ON public.beta_signups FOR SELECT TO service_role USING (true);

ALTER TABLE public.cafe_analytics ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cafe_reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to cafes" ON public.cafes FOR SELECT USING (true);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to delete their own friend requests" ON public.friend_requests FOR DELETE USING ((auth.uid() = sender_id));

CREATE POLICY "Allow users to read requests they are involved in" ON public.friend_requests FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));

CREATE POLICY "Allow users to update their own friend requests" ON public.friend_requests FOR UPDATE USING ((auth.uid() = sender_id)) WITH CHECK ((auth.uid() = sender_id));

CREATE POLICY "Enable insert for authenticated users only" ON public.friend_requests FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own friendships" ON public.friendships FOR SELECT USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow guest to view invitation by token" ON public.invitations FOR SELECT TO anon, authenticated USING (token::text = (current_setting('request.headers'::text, true))::jsonb->>'x-invitation-token');

CREATE POLICY "Allow users to delete their own invitations" ON public.invitations FOR DELETE USING ((auth.uid() = inviter_id));

CREATE POLICY "Allow users to read invitations they are involved in" ON public.invitations FOR SELECT USING (((auth.uid() = inviter_id) OR (auth.uid() = invitee_id)));

CREATE POLICY "Allow users to update their own invitations" ON public.invitations FOR UPDATE USING ((auth.uid() = inviter_id)) WITH CHECK ((auth.uid() = inviter_id));

CREATE POLICY "Enable insert for authenticated users only" ON public.invitations FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own badges" ON public.profile_badges FOR SELECT USING ((auth.uid() = profile_id));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "Allow users to view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));

CREATE TRIGGER award_account_creation_badge
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.award_badge('account_created');

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_beta_signup_accepted
AFTER UPDATE OF status ON public.beta_signups
FOR EACH ROW
WHEN ((new.status = 'accepted'::text))
EXECUTE FUNCTION public.add_beta_user_flag();