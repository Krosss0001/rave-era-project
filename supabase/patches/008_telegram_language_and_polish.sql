-- Telegram language preference and product polish.
-- Safe for existing databases. Server-managed via Supabase service role.

alter table if exists public.telegram_users
add column if not exists language text not null default 'uk';

alter table if exists public.telegram_registration_sessions
add column if not exists language text not null default 'uk';

create index if not exists telegram_users_language_idx
on public.telegram_users(language);

create index if not exists telegram_registration_sessions_language_idx
on public.telegram_registration_sessions(language);

alter table if exists public.telegram_users
drop constraint if exists telegram_users_language_check;

alter table if exists public.telegram_users
add constraint telegram_users_language_check
check (language in ('uk', 'en'));

alter table if exists public.telegram_registration_sessions
drop constraint if exists telegram_registration_sessions_language_check;

alter table if exists public.telegram_registration_sessions
add constraint telegram_registration_sessions_language_check
check (language in ('uk', 'en'));
