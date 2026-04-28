-- Raveera database foundation.
-- Run this file in the Supabase SQL Editor after auth is configured.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user',
  wallet_address text,
  telegram_username text,
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'organizer', 'admin', 'superadmin'))
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  date timestamptz,
  city text,
  venue text,
  address text,
  price numeric(12, 2) not null default 0,
  currency text not null default 'UAH',
  capacity int not null default 0,
  status text not null default 'draft',
  image_url text,
  organizer_id uuid references public.profiles(id) on delete set null,
  organizer_name text,
  organizer_description text,
  organizer_contact text,
  telegram_url text,
  lineup text not null default '',
  tags text not null default '',
  age_limit text,
  dress_code text,
  doors_open text,
  event_type text,
  ticket_wave_label text,
  urgency_note text,
  referral_enabled boolean not null default true,
  wallet_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint events_capacity_check check (capacity >= 0),
  constraint events_price_check check (price >= 0),
  constraint events_status_check check (status in ('draft', 'published', 'live', 'limited', 'soon', 'cancelled', 'archived'))
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text,
  email text,
  phone text,
  instagram_nickname text,
  telegram_username text,
  referral_code text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint registrations_status_check check (status in ('pending', 'confirmed', 'cancelled'))
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  ticket_code text not null unique,
  qr_payload text,
  status text not null default 'reserved',
  payment_status text not null default 'pending',
  checked_in boolean not null default false,
  created_at timestamptz not null default now(),
  constraint tickets_status_check check (status in ('reserved', 'active', 'used')),
  constraint tickets_payment_status_check check (payment_status in ('pending', 'paid', 'failed'))
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  owner_user_id uuid references public.profiles(id) on delete cascade,
  code text not null unique,
  clicks int not null default 0,
  registrations int not null default 0,
  confirmed int not null default 0,
  created_at timestamptz not null default now(),
  constraint referrals_clicks_check check (clicks >= 0),
  constraint referrals_registrations_check check (registrations >= 0),
  constraint referrals_confirmed_check check (confirmed >= 0)
);

create index if not exists events_organizer_id_idx on public.events(organizer_id);
create index if not exists events_status_idx on public.events(status);
create index if not exists registrations_event_id_idx on public.registrations(event_id);
create index if not exists registrations_user_id_idx on public.registrations(user_id);
create unique index if not exists registrations_event_user_unique_idx
on public.registrations(event_id, user_id)
where user_id is not null;
create index if not exists tickets_user_id_idx on public.tickets(user_id);
create index if not exists tickets_event_id_idx on public.tickets(event_id);
create unique index if not exists tickets_registration_unique_idx
on public.tickets(registration_id)
where registration_id is not null;
create index if not exists referrals_owner_user_id_idx on public.referrals(owner_user_id);
create index if not exists referrals_event_id_idx on public.referrals(event_id);

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'user'
  );
$$;

create or replace function public.has_role(required_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_role() = any(required_roles);
$$;

create or replace function public.get_event_registration_count(event_id_input uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.registrations
  where event_id = event_id_input
    and status <> 'cancelled';
$$;

create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_capacity integer;
  active_registrations integer;
begin
  select capacity
  into event_capacity
  from public.events
  where id = new.event_id
  for update;

  if event_capacity is null then
    raise exception 'Event is not available';
  end if;

  select count(*)::integer
  into active_registrations
  from public.registrations
  where event_id = new.event_id
    and status <> 'cancelled';

  if active_registrations >= event_capacity then
    raise exception 'Event is sold out';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_event_capacity_before_insert on public.registrations;
create trigger enforce_event_capacity_before_insert
before insert on public.registrations
for each row execute function public.enforce_event_capacity();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'user'
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.tickets enable row level security;
alter table public.referrals enable row level security;

drop policy if exists "Profiles are readable by owner and staff" on public.profiles;
create policy "Profiles are readable by owner and staff"
on public.profiles for select
using (
  auth.uid() = id
  or public.has_role(array['admin', 'superadmin'])
);

drop policy if exists "Users can insert own missing profile" on public.profiles;
create policy "Users can insert own missing profile"
on public.profiles for insert
with check (
  auth.uid() = id
  and role = 'user'
);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select role from public.profiles where id = auth.uid())
);

drop policy if exists "Admins can manage profiles" on public.profiles;
drop policy if exists "Admins can promote non-superadmin profiles" on public.profiles;
create policy "Admins can promote non-superadmin profiles"
on public.profiles for update
using (
  public.current_user_role() = 'admin'
  and role in ('user', 'organizer')
)
with check (
  public.current_user_role() = 'admin'
  and role in ('user', 'organizer', 'admin')
);

drop policy if exists "Superadmins can manage profiles" on public.profiles;
create policy "Superadmins can manage profiles"
on public.profiles for all
using (public.current_user_role() = 'superadmin')
with check (public.current_user_role() = 'superadmin');

drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events"
on public.events for select
using (status in ('published', 'live', 'limited', 'soon'));

drop policy if exists "Organizers can read own events" on public.events;
create policy "Organizers can read own events"
on public.events for select
using (
  organizer_id = auth.uid()
  or public.has_role(array['admin', 'superadmin'])
);

drop policy if exists "Organizers can create own events" on public.events;
create policy "Organizers can create own events"
on public.events for insert
with check (
  organizer_id = auth.uid()
  and public.has_role(array['organizer', 'admin', 'superadmin'])
);

drop policy if exists "Organizers can update own events" on public.events;
create policy "Organizers can update own events"
on public.events for update
using (
  (organizer_id = auth.uid() and public.has_role(array['organizer', 'admin', 'superadmin']))
  or public.has_role(array['admin', 'superadmin'])
)
with check (
  (organizer_id = auth.uid() and public.has_role(array['organizer', 'admin', 'superadmin']))
  or public.has_role(array['admin', 'superadmin'])
);

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
on public.events for delete
using (public.has_role(array['admin', 'superadmin']));

drop policy if exists "Users can create own registrations" on public.registrations;
create policy "Users can create own registrations"
on public.registrations for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can read own registrations" on public.registrations;
create policy "Users can read own registrations"
on public.registrations for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.events
    where events.id = registrations.event_id
      and events.organizer_id = auth.uid()
  )
  or public.has_role(array['admin', 'superadmin'])
);

drop policy if exists "Admins can manage registrations" on public.registrations;
create policy "Admins can manage registrations"
on public.registrations for all
using (public.has_role(array['admin', 'superadmin']))
with check (public.has_role(array['admin', 'superadmin']));

drop policy if exists "Users can read own tickets" on public.tickets;
create policy "Users can read own tickets"
on public.tickets for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.events
    where events.id = tickets.event_id
      and events.organizer_id = auth.uid()
  )
  or public.has_role(array['admin', 'superadmin'])
);

drop policy if exists "Users can create own reserved tickets" on public.tickets;
create policy "Users can create own reserved tickets"
on public.tickets for insert
with check (
  auth.uid() = user_id
  and status = 'reserved'
  and payment_status = 'pending'
  and exists (
    select 1
    from public.registrations
    where registrations.id = tickets.registration_id
      and registrations.event_id = tickets.event_id
      and registrations.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage tickets" on public.tickets;
create policy "Admins can manage tickets"
on public.tickets for all
using (public.has_role(array['admin', 'superadmin']))
with check (public.has_role(array['admin', 'superadmin']));

drop policy if exists "Users can read own referrals" on public.referrals;
create policy "Users can read own referrals"
on public.referrals for select
using (
  auth.uid() = owner_user_id
  or exists (
    select 1
    from public.events
    where events.id = referrals.event_id
      and events.organizer_id = auth.uid()
  )
  or public.has_role(array['admin', 'superadmin'])
);

drop policy if exists "Users can create own referrals" on public.referrals;
create policy "Users can create own referrals"
on public.referrals for insert
with check (auth.uid() = owner_user_id);

drop policy if exists "Admins can manage referrals" on public.referrals;
create policy "Admins can manage referrals"
on public.referrals for all
using (public.has_role(array['admin', 'superadmin']))
with check (public.has_role(array['admin', 'superadmin']));
