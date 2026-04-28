-- Telegram broadcast foundation.
-- Server-managed only: route handlers should use Supabase service role.

alter table if exists public.telegram_users
add column if not exists is_subscribed boolean not null default true;

create table if not exists public.telegram_broadcasts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  audience text not null,
  language text not null default 'uk',
  message text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint telegram_broadcasts_audience_check check (
    audience in (
      'all_telegram_users',
      'event_registered',
      'event_confirmed',
      'event_pending_payment',
      'event_paid',
      'event_checked_in',
      'bot_interacted_not_registered'
    )
  ),
  constraint telegram_broadcasts_language_check check (language in ('uk', 'en')),
  constraint telegram_broadcasts_status_check check (status in ('draft', 'queued', 'sending', 'sent', 'failed', 'cancelled'))
);

create table if not exists public.telegram_broadcast_recipients (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.telegram_broadcasts(id) on delete cascade,
  telegram_user_id text references public.telegram_users(telegram_user_id) on delete set null,
  chat_id text not null,
  status text not null default 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint telegram_broadcast_recipients_status_check check (status in ('queued', 'sending', 'sent', 'failed', 'skipped'))
);

create index if not exists telegram_users_is_subscribed_idx
on public.telegram_users(is_subscribed);

create index if not exists telegram_broadcasts_created_by_idx
on public.telegram_broadcasts(created_by);

create index if not exists telegram_broadcasts_event_id_idx
on public.telegram_broadcasts(event_id);

create index if not exists telegram_broadcasts_audience_idx
on public.telegram_broadcasts(audience);

create index if not exists telegram_broadcasts_status_idx
on public.telegram_broadcasts(status);

create index if not exists telegram_broadcast_recipients_broadcast_id_idx
on public.telegram_broadcast_recipients(broadcast_id);

create index if not exists telegram_broadcast_recipients_telegram_user_id_idx
on public.telegram_broadcast_recipients(telegram_user_id);

create index if not exists telegram_broadcast_recipients_chat_id_idx
on public.telegram_broadcast_recipients(chat_id);

create index if not exists telegram_broadcast_recipients_status_idx
on public.telegram_broadcast_recipients(status);

create unique index if not exists telegram_broadcast_recipients_broadcast_chat_unique_idx
on public.telegram_broadcast_recipients(broadcast_id, chat_id);

alter table public.telegram_broadcasts enable row level security;
alter table public.telegram_broadcast_recipients enable row level security;

drop policy if exists "Admins can manage telegram broadcasts"
on public.telegram_broadcasts;

create policy "Admins can manage telegram broadcasts"
on public.telegram_broadcasts for all
using (public.has_role(array['admin', 'superadmin']))
with check (public.has_role(array['admin', 'superadmin']));

drop policy if exists "Admins can manage telegram broadcast recipients"
on public.telegram_broadcast_recipients;

create policy "Admins can manage telegram broadcast recipients"
on public.telegram_broadcast_recipients for all
using (public.has_role(array['admin', 'superadmin']))
with check (public.has_role(array['admin', 'superadmin']));
