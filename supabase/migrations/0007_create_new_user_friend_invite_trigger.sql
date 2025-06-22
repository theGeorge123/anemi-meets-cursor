create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Look for pending friend invites for the new user's email
  update public.friend_invites
  set
    status = 'accepted',
    accepted_at = now()
  where
    invitee_email = new.email and status = 'pending';

  -- Create friendships for any newly accepted invites
  insert into public.friendships (user_id, friend_id, status)
  select
    inviter_id,
    new.id,
    'accepted'
  from
    public.friend_invites
  where
    invitee_email = new.email and status = 'accepted'
  on conflict (user_id, friend_id) do nothing;

  insert into public.friendships (user_id, friend_id, status)
  select
    new.id,
    inviter_id,
    'accepted'
  from
    public.friend_invites
  where
    invitee_email = new.email and status = 'accepted'
  on conflict (user_id, friend_id) do nothing;

  return new;
end;
$$;

-- Drop trigger if it exists to ensure a clean setup
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger to run after a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 