-- Safe for existing databases. Enables optional wallet linking without changing auth.

alter table public.profiles
  add column if not exists wallet_address text;
