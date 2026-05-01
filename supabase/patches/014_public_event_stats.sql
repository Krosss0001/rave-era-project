create or replace function public.get_public_event_stats(event_ids uuid[])
returns table (
  event_id uuid,
  total_registrations bigint,
  confirmed_registrations bigint,
  pending_registrations bigint,
  paid_tickets bigint,
  reserved_tickets bigint,
  active_tickets bigint,
  used_tickets bigint,
  checked_in_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with requested_events as (
    select events.id
    from public.events
    where events.id = any(event_ids)
      and events.status in ('published', 'live', 'limited', 'soon')
  ),
  registration_stats as (
    select
      registrations.event_id,
      count(*) as total_registrations,
      count(*) filter (where registrations.status = 'confirmed') as confirmed_registrations,
      count(*) filter (where registrations.status = 'pending') as pending_registrations
    from public.registrations
    join requested_events on requested_events.id = registrations.event_id
    group by registrations.event_id
  ),
  ticket_stats as (
    select
      tickets.event_id,
      count(*) filter (where tickets.payment_status = 'paid') as paid_tickets,
      count(*) filter (where tickets.status = 'reserved') as reserved_tickets,
      count(*) filter (where tickets.status = 'active') as active_tickets,
      count(*) filter (where tickets.status = 'used') as used_tickets,
      count(*) filter (where tickets.checked_in or tickets.checked_in_at is not null or tickets.status = 'used') as checked_in_count
    from public.tickets
    join requested_events on requested_events.id = tickets.event_id
    group by tickets.event_id
  )
  select
    requested_events.id as event_id,
    coalesce(registration_stats.total_registrations, 0) as total_registrations,
    coalesce(registration_stats.confirmed_registrations, 0) as confirmed_registrations,
    coalesce(registration_stats.pending_registrations, 0) as pending_registrations,
    coalesce(ticket_stats.paid_tickets, 0) as paid_tickets,
    coalesce(ticket_stats.reserved_tickets, 0) as reserved_tickets,
    coalesce(ticket_stats.active_tickets, 0) as active_tickets,
    coalesce(ticket_stats.used_tickets, 0) as used_tickets,
    coalesce(ticket_stats.checked_in_count, 0) as checked_in_count
  from requested_events
  left join registration_stats on registration_stats.event_id = requested_events.id
  left join ticket_stats on ticket_stats.event_id = requested_events.id;
$$;

grant execute on function public.get_public_event_stats(uuid[]) to anon, authenticated;
