-- Dedicated referral link analytics support.
-- Safe to apply on an existing database. Does not reset referral rows.

alter table if exists public.referrals
  add column if not exists label text,
  add column if not exists source text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists clicks integer not null default 0,
  add column if not exists telegram_starts integer not null default 0,
  add column if not exists registrations integer not null default 0,
  add column if not exists confirmed integer not null default 0,
  add column if not exists paid integer not null default 0,
  add column if not exists checked_in integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.telegram_registration_sessions
  add column if not exists referral_code text;

create index if not exists referrals_event_id_idx
on public.referrals(event_id);

create index if not exists referrals_code_idx
on public.referrals(code);

create index if not exists referrals_created_by_idx
on public.referrals(created_by);

create unique index if not exists referrals_event_id_code_unique_idx
on public.referrals(event_id, code)
where event_id is not null;
