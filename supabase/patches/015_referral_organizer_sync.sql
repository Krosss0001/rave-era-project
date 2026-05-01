-- Reliable referral analytics and organizer registration sync.
-- Returns counts/detail rows only to authenticated platform roles.

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
    where public.current_user_role() in ('admin', 'superadmin')
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
      public.current_user_role() in ('admin', 'superadmin')
      or (
        public.current_user_role() = 'organizer'
        and events.organizer_id = auth.uid()
      )
    )
  order by registrations.created_at desc;
$$;

grant execute on function public.get_organizer_registration_rows(uuid[]) to authenticated;
