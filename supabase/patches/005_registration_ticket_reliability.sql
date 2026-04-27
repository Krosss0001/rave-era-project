-- Raveera registration and ticket reliability pass.
-- Safe to run after supabase/schema.sql on an existing database.
-- Normalizes statuses, adds idempotency constraints, and enforces capacity
-- inside Postgres so the browser client is not the security boundary.

update public.registrations
set status = case
  when status in ('pending', 'invited', 'payment_pending') then 'pending'
  when status in ('confirmed', 'checked_in') then 'confirmed'
  when status = 'cancelled' then 'cancelled'
  else 'pending'
end;

update public.tickets
set status = case
  when status = 'reserved' then 'reserved'
  when status in ('issued', 'paid') then 'active'
  when status = 'used' then 'used'
  when status = 'cancelled' then 'used'
  else 'reserved'
end;

update public.tickets
set payment_status = case
  when payment_status = 'paid' then 'paid'
  when payment_status = 'failed' then 'failed'
  when payment_status in ('pending', 'refunded', 'comped') then 'pending'
  else 'pending'
end;

alter table public.registrations
drop constraint if exists registrations_status_check;

alter table public.registrations
add constraint registrations_status_check
check (status in ('pending', 'confirmed', 'cancelled'));

alter table public.tickets
drop constraint if exists tickets_status_check;

alter table public.tickets
add constraint tickets_status_check
check (status in ('reserved', 'active', 'used'));

alter table public.tickets
drop constraint if exists tickets_payment_status_check;

alter table public.tickets
add constraint tickets_payment_status_check
check (payment_status in ('pending', 'paid', 'failed'));

create unique index if not exists registrations_event_user_unique_idx
on public.registrations(event_id, user_id)
where user_id is not null;

create unique index if not exists tickets_registration_unique_idx
on public.tickets(registration_id)
where registration_id is not null;

create or replace function public.get_event_registration_count(event_id_input uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.registrations
  where event_id = event_id_input
    and status <> 'cancelled';
$$;

create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_capacity integer;
  active_registrations integer;
begin
  select capacity
  into event_capacity
  from public.events
  where id = new.event_id
  for update;

  if event_capacity is null then
    raise exception 'Event is not available';
  end if;

  select count(*)::integer
  into active_registrations
  from public.registrations
  where event_id = new.event_id
    and status <> 'cancelled';

  if active_registrations >= event_capacity then
    raise exception 'Event is sold out';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_event_capacity_before_insert on public.registrations;
create trigger enforce_event_capacity_before_insert
before insert on public.registrations
for each row execute function public.enforce_event_capacity();

drop policy if exists "Users can create own reserved tickets" on public.tickets;
create policy "Users can create own reserved tickets"
on public.tickets for insert
with check (
  auth.uid() = user_id
  and status = 'reserved'
  and payment_status = 'pending'
  and exists (
    select 1
    from public.registrations
    where registrations.id = tickets.registration_id
      and registrations.event_id = tickets.event_id
      and registrations.user_id = auth.uid()
  )
);
