-- Rave'era Telegram registration session state.
-- Server-managed only: route handlers should use Supabase service role.

create table if not exists public.telegram_registration_sessions (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id text not null,
  chat_id text not null,
  event_id uuid references public.events(id) on delete cascade,
  event_slug text,
  step text not null default 'started',
  name text,
  phone text,
  position_company text,
  industry text,
  telegram_username text,
  registration_id uuid references public.registrations(id) on delete set null,
  ticket_id uuid references public.tickets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists telegram_registration_sessions_user_idx
on public.telegram_registration_sessions(telegram_user_id, chat_id);

create unique index if not exists telegram_registration_sessions_user_event_unique_idx
on public.telegram_registration_sessions(telegram_user_id, chat_id, event_id)
where event_id is not null;

create unique index if not exists registrations_event_telegram_username_unique_idx
on public.registrations(event_id, lower(telegram_username))
where user_id is null
  and telegram_username is not null;

create or replace function public.touch_telegram_registration_session()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_telegram_registration_session_before_update
on public.telegram_registration_sessions;

create trigger touch_telegram_registration_session_before_update
before update on public.telegram_registration_sessions
for each row execute function public.touch_telegram_registration_session();

alter table public.telegram_registration_sessions enable row level security;

drop policy if exists "No client access to telegram registration sessions"
on public.telegram_registration_sessions;

-- Intentionally no select/insert/update/delete policies.
-- The webhook route uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
