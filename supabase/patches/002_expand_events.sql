-- Raveera event expansion patch.
-- Safe to run in Supabase SQL Editor after supabase/schema.sql.

alter table if exists public.events
  add column if not exists organizer_name text,
  add column if not exists organizer_description text,
  add column if not exists organizer_contact text,
  add column if not exists telegram_url text,
  add column if not exists address text,
  add column if not exists lineup text not null default '',
  add column if not exists tags text not null default '',
  add column if not exists age_limit text,
  add column if not exists dress_code text,
  add column if not exists doors_open text,
  add column if not exists event_type text,
  add column if not exists ticket_wave_label text,
  add column if not exists urgency_note text,
  add column if not exists referral_enabled boolean not null default true,
  add column if not exists wallet_enabled boolean not null default true;
