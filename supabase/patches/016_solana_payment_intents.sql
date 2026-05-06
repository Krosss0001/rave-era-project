-- Devnet-only Solana Pay payment intents for reserved paid tickets.
-- Safe to run on existing databases.

create table if not exists public.solana_payment_intents (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  wallet_address text,
  reference text not null unique,
  recipient text not null,
  amount_sol numeric not null,
  network text not null default 'devnet',
  status text not null default 'pending',
  signature text,
  created_at timestamptz default now(),
  confirmed_at timestamptz,
  constraint solana_payment_intents_network_check check (network = 'devnet'),
  constraint solana_payment_intents_status_check check (status in ('pending', 'confirmed', 'failed'))
);

create index if not exists solana_payment_intents_ticket_id_idx
on public.solana_payment_intents(ticket_id);

create index if not exists solana_payment_intents_registration_id_idx
on public.solana_payment_intents(registration_id);

create index if not exists solana_payment_intents_event_id_idx
on public.solana_payment_intents(event_id);

create index if not exists solana_payment_intents_reference_idx
on public.solana_payment_intents(reference);

create index if not exists solana_payment_intents_status_idx
on public.solana_payment_intents(status);

alter table public.solana_payment_intents enable row level security;

drop policy if exists "Users can read own Solana payment intents" on public.solana_payment_intents;
create policy "Users can read own Solana payment intents"
on public.solana_payment_intents for select
using (auth.uid() = user_id);
