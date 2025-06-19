-- Create beta_signups table for beta email signups
create table if not exists public.beta_signups (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  created_at timestamptz default now(),
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected'))
);

-- Enable RLS
alter table public.beta_signups enable row level security;

-- Policy: Anyone can insert (for signup)
drop policy if exists "Anyone can sign up for beta" on public.beta_signups;
create policy "Anyone can sign up for beta" on public.beta_signups
  for insert with check (true);

-- Policy: Only admin can view (service_role)
create policy "Admin can view all" on public.beta_signups
  for select using (auth.role() = 'service_role'); 