-- Telegram identity linking for bot menu, search, and My Tickets.
-- Server-managed only: route handlers should use Supabase service role.

create table if not exists public.telegram_users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id text unique not null,
  chat_id text not null,
  username text,
  first_name text,
  last_name text,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.registrations
add column if not exists telegram_user_id text;

create index if not exists telegram_users_profile_id_idx
on public.telegram_users(profile_id);

create index if not exists registrations_telegram_user_id_idx
on public.registrations(telegram_user_id);

create unique index if not exists registrations_event_telegram_user_unique_idx
on public.registrations(event_id, telegram_user_id)
where user_id is null
  and telegram_user_id is not null;

create or replace function public.touch_telegram_user()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_telegram_user_before_update
on public.telegram_users;

create trigger touch_telegram_user_before_update
before update on public.telegram_users
for each row execute function public.touch_telegram_user();

alter table public.telegram_users enable row level security;

-- Intentionally no client policies.
-- The Telegram webhook uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
