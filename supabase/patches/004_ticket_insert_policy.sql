-- Raveera ticket insert policy.
-- Safe to run in Supabase SQL Editor after supabase/schema.sql.
-- Allows a signed-in user to create only their own pending reserved ticket
-- for a registration row that already belongs to them.

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
