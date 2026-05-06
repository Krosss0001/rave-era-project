-- Store Devnet demo conversion details used when creating Solana payment intents.
-- Safe to run on existing databases.

alter table public.solana_payment_intents
  add column if not exists price_uah numeric,
  add column if not exists rate_uah_per_sol numeric;
