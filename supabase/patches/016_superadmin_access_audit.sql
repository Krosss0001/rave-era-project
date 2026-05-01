-- Make the platform role hierarchy explicit for SQL-side access checks.
-- superadmin is the highest role and satisfies every lower minimum role.

create or replace function public.role_rank(role_input text)
returns integer
language sql
immutable
as $$
  select case role_input
    when 'superadmin' then 3
    when 'admin' then 2
    when 'organizer' then 1
    when 'user' then 0
    else -1
  end;
$$;

create or replace function public.has_minimum_role(minimum_role text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.role_rank(public.current_user_role()) >= public.role_rank(minimum_role);
$$;

create or replace function public.get_referral_analytics()
returns table (
  referral_id uuid,
  event_id uuid,
  code text,
  registrations bigint,
  confirmed bigint,
  paid bigint,
  checked_in bigint,
  conversion numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with visible_referrals as (
    select referrals.id, referrals.event_id, referrals.code, referrals.clicks, referrals.telegram_starts
    from public.referrals
    left join public.events on events.id = referrals.event_id
    where public.has_minimum_role('admin')
       or (
         public.current_user_role() = 'organizer'
         and events.organizer_id = auth.uid()
       )
  ),
  referral_registrations as (
    select
      visible_referrals.id as referral_id,
      registrations.id as registration_id,
      registrations.status
    from visible_referrals
    join public.registrations
      on registrations.event_id = visible_referrals.event_id
     and registrations.referral_code = visible_referrals.code
  ),
  registration_counts as (
    select
      referral_id,
      count(*) as registrations,
      count(*) filter (where status = 'confirmed') as confirmed
    from referral_registrations
    group by referral_id
  ),
  ticket_counts as (
    select
      referral_registrations.referral_id,
      count(tickets.id) filter (where tickets.payment_status = 'paid') as paid,
      count(tickets.id) filter (
        where tickets.status = 'used'
           or tickets.checked_in = true
           or tickets.checked_in_at is not null
      ) as checked_in
    from referral_registrations
    left join public.tickets on tickets.registration_id = referral_registrations.registration_id
    group by referral_registrations.referral_id
  )
  select
    visible_referrals.id as referral_id,
    visible_referrals.event_id,
    visible_referrals.code,
    coalesce(registration_counts.registrations, 0) as registrations,
    coalesce(registration_counts.confirmed, 0) as confirmed,
    coalesce(ticket_counts.paid, 0) as paid,
    coalesce(ticket_counts.checked_in, 0) as checked_in,
    coalesce(registration_counts.registrations, 0)::numeric /
      greatest(coalesce(visible_referrals.clicks, 0) + coalesce(visible_referrals.telegram_starts, 0), 1)::numeric as conversion
  from visible_referrals
  left join registration_counts on registration_counts.referral_id = visible_referrals.id
  left join ticket_counts on ticket_counts.referral_id = visible_referrals.id;
$$;

grant execute on function public.role_rank(text) to authenticated;
grant execute on function public.has_minimum_role(text) to authenticated;
grant execute on function public.get_referral_analytics() to authenticated;

create or replace function public.get_organizer_registration_rows(event_ids uuid[])
returns table (
  registration_id uuid,
  event_id uuid,
  name text,
  email text,
  phone text,
  instagram_nickname text,
  telegram_username text,
  telegram_user_id text,
  referral_code text,
  registration_status text,
  registration_created_at timestamptz,
  ticket_id uuid,
  ticket_status text,
  payment_status text,
  checked_in boolean,
  checked_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    registrations.id as registration_id,
    registrations.event_id,
    registrations.name,
    registrations.email,
    registrations.phone,
    registrations.instagram_nickname,
    registrations.telegram_username,
    registrations.telegram_user_id,
    registrations.referral_code,
    registrations.status as registration_status,
    registrations.created_at as registration_created_at,
    tickets.id as ticket_id,
    tickets.status as ticket_status,
    tickets.payment_status,
    tickets.checked_in,
    tickets.checked_in_at
  from public.registrations
  join public.events on events.id = registrations.event_id
  left join public.tickets on tickets.registration_id = registrations.id
  where registrations.event_id = any(event_ids)
    and (
      public.has_minimum_role('admin')
      or (
        public.current_user_role() = 'organizer'
        and events.organizer_id = auth.uid()
      )
    )
  order by registrations.created_at desc;
$$;

grant execute on function public.get_organizer_registration_rows(uuid[]) to authenticated;

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
    tickets.checked_in_at,
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

  if not public.has_minimum_role('organizer') then
    raise exception 'access_denied';
  end if;

  if actor_role = 'organizer' and ticket_record.organizer_id is distinct from actor_id then
    raise exception 'access_denied';
  end if;

  if ticket_record.checked_in or ticket_record.checked_in_at is not null or ticket_record.status = 'used' then
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
