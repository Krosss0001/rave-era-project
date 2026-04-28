-- Contact fields collected by the Ukrainian-only Telegram registration flow.

alter table if exists public.registrations
add column if not exists phone text,
add column if not exists instagram_nickname text;
