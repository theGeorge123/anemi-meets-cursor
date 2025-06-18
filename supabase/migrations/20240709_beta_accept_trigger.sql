-- Trigger to call Edge Function when a beta signup is accepted
create or replace function public.notify_beta_accepted()
returns trigger as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    perform net.http_post(
      'https://<your-project-ref>.functions.supabase.co/beta-accept-email',
      json_build_object('record', row_to_json(new))::text,
      'application/json'
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists beta_accepted_notify on public.beta_signups;
create trigger beta_accepted_notify
  after update on public.beta_signups
  for each row
  execute function public.notify_beta_accepted(); 