alter table public.tickets
add column if not exists checked_in_at timestamptz;

alter table public.tickets
add column if not exists checked_in_by uuid references public.profiles(id) on delete set null;

create index if not exists tickets_checked_in_by_idx on public.tickets(checked_in_by);

create or replace function public.check_in_ticket(ticket_code_input text)
returns table (
  ticket_id uuid,
  event_id uuid,
  event_title text,
  ticket_code text,
  status text,
  payment_status text,
  checked_in boolean,
  checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text := public.current_user_role();
  ticket_record record;
begin
  if actor_id is null then
    raise exception 'not_authenticated';
  end if;

  select
    tickets.id,
    tickets.event_id,
    tickets.ticket_code,
    tickets.status,
    tickets.payment_status,
    tickets.checked_in,
    events.title as event_title,
    events.organizer_id
  into ticket_record
  from public.tickets
  join public.events on events.id = tickets.event_id
  where tickets.ticket_code = upper(trim(ticket_code_input))
  for update of tickets;

  if not found then
    raise exception 'ticket_not_found';
  end if;

  if actor_role not in ('organizer', 'admin', 'superadmin') then
    raise exception 'access_denied';
  end if;

  if actor_role = 'organizer' and ticket_record.organizer_id is distinct from actor_id then
    raise exception 'access_denied';
  end if;

  if ticket_record.checked_in or ticket_record.status = 'used' then
    raise exception 'ticket_already_checked_in';
  end if;

  if ticket_record.status <> 'active' or ticket_record.payment_status <> 'paid' then
    raise exception 'ticket_not_active_paid';
  end if;

  update public.tickets
  set
    status = 'used',
    checked_in = true,
    checked_in_at = now(),
    checked_in_by = actor_id
  where tickets.id = ticket_record.id;

  return query
  select
    tickets.id as ticket_id,
    tickets.event_id,
    events.title as event_title,
    tickets.ticket_code,
    tickets.status,
    tickets.payment_status,
    tickets.checked_in,
    tickets.checked_in_at
  from public.tickets
  join public.events on events.id = tickets.event_id
  where tickets.id = ticket_record.id;
end;
$$;

grant execute on function public.check_in_ticket(text) to authenticated;
