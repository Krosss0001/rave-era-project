-- Display-only event stats overrides for organizer operations.
-- These fields do not create registrations or tickets.

alter table public.events
  add column if not exists manual_registered_override integer,
  add column if not exists manual_remaining_override integer,
  add column if not exists stats_note text;

alter table public.events
  drop constraint if exists events_manual_registered_override_check;

alter table public.events
  add constraint events_manual_registered_override_check
  check (manual_registered_override is null or manual_registered_override >= 0);

alter table public.events
  drop constraint if exists events_manual_remaining_override_check;

alter table public.events
  add constraint events_manual_remaining_override_check
  check (manual_remaining_override is null or manual_remaining_override >= 0);

create or replace function public.validate_event_stats_overrides()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() not in ('admin', 'superadmin')
     and new.manual_registered_override is not null
     and new.manual_registered_override > new.capacity then
    raise exception 'manual_registered_override_exceeds_capacity';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_event_stats_overrides_before_write on public.events;

create trigger validate_event_stats_overrides_before_write
before insert or update of manual_registered_override, manual_remaining_override, capacity on public.events
for each row execute function public.validate_event_stats_overrides();
