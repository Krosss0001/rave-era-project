-- Superadmin referral link builder support.
-- Safe to apply on an existing database.

alter table if exists public.referrals
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists label text,
  add column if not exists telegram_starts integer not null default 0;

alter table if exists public.telegram_registration_sessions
  add column if not exists referral_code text;

create index if not exists referrals_created_by_idx
on public.referrals(created_by);

create index if not exists referrals_event_id_idx
on public.referrals(event_id);

create index if not exists referrals_code_idx
on public.referrals(code);

create unique index if not exists referrals_event_id_code_unique_idx
on public.referrals(event_id, code)
where event_id is not null;
