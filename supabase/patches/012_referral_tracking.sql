-- Referral tracking counters and per-event code support.
-- Safe to apply on an existing database.

alter table if exists public.referrals
  add column if not exists source text,
  add column if not exists clicks integer not null default 0,
  add column if not exists registrations integer not null default 0,
  add column if not exists confirmed integer not null default 0,
  add column if not exists created_at timestamptz not null default now();

create index if not exists referrals_event_id_idx
on public.referrals(event_id);

create index if not exists referrals_code_idx
on public.referrals(code);

create unique index if not exists referrals_event_id_code_unique_idx
on public.referrals(event_id, code)
where event_id is not null;
