-- MedPlanner planning and data-safety foundation.
-- Additive and reversible: no existing rows or tables are removed.

create extension if not exists pgcrypto;

alter table public.appointments
  add column if not exists planning_status text not null default 'programmato',
  add column if not exists is_locked boolean not null default false,
  add column if not exists locked_reason text,
  add column if not exists source text not null default 'manuale',
  add column if not exists change_set_id uuid,
  add column if not exists doctor_id uuid references public.doctors(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid,
  add column if not exists delete_reason text;

alter table public.appointments drop constraint if exists appointments_planning_status_check;
alter table public.appointments add constraint appointments_planning_status_check
  check (planning_status in ('proposto','programmato','confermato','completato','annullato'));
alter table public.appointments drop constraint if exists appointments_source_check;
alter table public.appointments add constraint appointments_source_check
  check (source in ('manuale','importazione','ai','bulk'));

-- Preserve every pre-existing future appointment as an immutable planning anchor.
update public.appointments
set planning_status = case
      when status in ('confermato','completato') then status
      else 'programmato'
    end,
    is_locked = true,
    locked_reason = coalesce(locked_reason, 'Appuntamento esistente prima della migrazione')
where date >= current_date and deleted_at is null;

update public.appointments a
set doctor_id = d.id
from public.doctors d
where a.doctor_id is null
  and a.user_id = d.user_id
  and lower(trim(a.name)) = lower(trim(d.name));

create index if not exists appointments_active_week_idx
  on public.appointments(user_id, date, doctor_id) where deleted_at is null;
create index if not exists appointments_trash_idx
  on public.appointments(user_id, deleted_at) where deleted_at is not null;

create table if not exists public.change_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('import','weekly_plan','bulk','restore')),
  status text not null default 'bozza' check (status in ('bozza','pronto','applicato','annullato','ripristinato')),
  source text not null default 'manuale' check (source in ('manuale','importazione','ai','bulk')),
  idempotency_key text,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

alter table public.appointments
  add constraint appointments_change_set_id_fkey foreign key (change_set_id)
  references public.change_sets(id) on delete set null;

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  source text not null default 'manuale',
  actor_id uuid,
  change_set_id uuid references public.change_sets(id) on delete set null,
  diff jsonb not null default '{}'::jsonb,
  snapshot jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_revisions (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  appointment_id uuid not null,
  actor_id uuid,
  source text not null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  change_set_id uuid references public.change_sets(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.data_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  snapshot_type text not null check (snapshot_type in ('daily','pre_import','pre_changeset','manual')),
  change_set_id uuid references public.change_sets(id) on delete set null,
  payload jsonb not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.healthcare_facilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  facility_type text not null check (facility_type in ('ospedale','asl','clinica_privata','poliambulatorio','studio')),
  paese text not null default '',
  microarea text not null default '',
  address text not null default '',
  latitude numeric(9,6),
  longitude numeric(9,6),
  preferred_hours jsonb not null default '{}'::jsonb,
  notes text not null default '',
  structure_slot_enabled boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name, address)
);

create table if not exists public.doctor_facilities (
  user_id uuid not null,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  facility_id uuid not null references public.healthcare_facilities(id) on delete cascade,
  preferred_hours jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  primary key(doctor_id, facility_id)
);

alter table public.doctors
  add column if not exists normalized_name text,
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists sync_status text not null default 'manuale',
  add column if not exists source_updated_at timestamptz,
  add column if not exists manual_fields text[] not null default '{}'::text[];
create unique index if not exists doctors_external_identity_idx
  on public.doctors(user_id, external_source, external_id)
  where external_source is not null and external_id is not null;

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  import_type text not null check (import_type in ('schedario','ab_plan','ro','ims')),
  source_name text not null default 'upload_manuale',
  file_name text not null,
  storage_path text not null,
  file_hash text not null,
  status text not null default 'caricato' check (status in ('caricato','analizzato','da_revisionare','applicato','errore','annullato')),
  total_records integer not null default 0,
  report jsonb not null default '{}'::jsonb,
  mapping jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  unique(user_id, import_type, file_hash)
);

create table if not exists public.import_staging (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  import_id uuid not null references public.imports(id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  normalized_data jsonb not null,
  classification text not null check (classification in ('nuovo_certo','aggiornamento_certo','possibile_duplicato','incompleto_ambiguo')),
  matched_doctor_id uuid references public.doctors(id) on delete set null,
  confidence numeric(5,4),
  diff jsonb not null default '{}'::jsonb,
  resolution text,
  applied_at timestamptz,
  unique(import_id, row_number)
);

create table if not exists public.coverage_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  input_type text not null check (input_type in ('ab_plan','ro','ims')),
  cycle_start date not null,
  cycle_end date not null,
  microarea text not null,
  product_id uuid references public.products(id) on delete cascade,
  planned_days numeric(7,2),
  target_value numeric(12,2),
  actual_value numeric(12,2),
  source_import_id uuid references public.imports(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, input_type, cycle_start, microarea, product_id)
);

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  week_start date not null check (extract(isodow from week_start) = 1),
  status text not null default 'bozza' check (status in ('bozza','proposto','approvato','archiviato')),
  change_set_id uuid references public.change_sets(id) on delete set null,
  rationale jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create table if not exists public.weekly_plan_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  plan_date date not null,
  microarea text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(weekly_plan_id, plan_date)
);

create table if not exists public.visit_product_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  patient_goal integer not null check (patient_goal >= 0),
  priority integer not null default 0,
  rationale text not null default '',
  created_at timestamptz not null default now(),
  unique(appointment_id, product_id)
);

-- Private source-file storage. Paths must begin with the authenticated user's id.
insert into storage.buckets (id, name, public)
values ('planning-imports', 'planning-imports', false)
on conflict (id) do nothing;

drop policy if exists "planning imports own select" on storage.objects;
create policy "planning imports own select" on storage.objects for select
  using (bucket_id = 'planning-imports' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "planning imports own insert" on storage.objects;
create policy "planning imports own insert" on storage.objects for insert
  with check (bucket_id = 'planning-imports' and auth.uid()::text = (storage.foldername(name))[1]);

-- RLS is uniform: identity comes from auth.uid(), never from a client-selected user.
do $$
declare t text;
begin
  foreach t in array array[
    'change_sets','audit_log','appointment_revisions','data_snapshots',
    'healthcare_facilities','doctor_facilities','imports','import_staging',
    'coverage_inputs','weekly_plans','weekly_plan_days','visit_product_goals'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Append-only logs/revisions/snapshots cannot be changed or removed by clients.
revoke insert, update, delete on public.audit_log, public.appointment_revisions, public.data_snapshots from authenticated;

create or replace function public.jsonb_diff(old_row jsonb, new_row jsonb)
returns jsonb language sql immutable set search_path = public as $$
  select coalesce(jsonb_object_agg(n.key, jsonb_build_object('old', o.value, 'new', n.value)), '{}'::jsonb)
  from jsonb_each(new_row) n
  left join jsonb_each(old_row) o using (key)
  where n.value is distinct from o.value
$$;

create or replace function public.audit_owned_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare oldj jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
declare newj jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
declare uid uuid := coalesce((newj->>'user_id')::uuid, (oldj->>'user_id')::uuid);
declare eid uuid := coalesce((newj->>'id')::uuid, (oldj->>'id')::uuid);
declare src text := coalesce(newj->>'source', oldj->>'source', 'manuale');
declare cs uuid := coalesce((newj->>'change_set_id')::uuid, (oldj->>'change_set_id')::uuid);
begin
  insert into public.audit_log(user_id, entity_type, entity_id, action, source, actor_id, change_set_id, diff, snapshot)
  values(uid, tg_table_name, eid, lower(tg_op), src, auth.uid(), cs,
    public.jsonb_diff(oldj, newj),
    case when tg_op = 'DELETE' or src in ('importazione','bulk','ai') then coalesce(newj, oldj) end);
  if tg_table_name = 'appointments' then
    insert into public.appointment_revisions(user_id, appointment_id, actor_id, source, action, old_values, new_values, change_set_id)
    values(uid, eid, auth.uid(), src, lower(tg_op), nullif(oldj, '{}'::jsonb), nullif(newj, '{}'::jsonb), cs);
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create or replace function public.protect_locked_appointment()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.is_locked and (
    new.date is distinct from old.date or new.time is distinct from old.time or
    new.doctor_id is distinct from old.doctor_id or new.name is distinct from old.name or
    new.address is distinct from old.address or new.paese is distinct from old.paese or
    new.microarea is distinct from old.microarea or new.deleted_at is distinct from old.deleted_at
  ) and coalesce(current_setting('medplanner.allow_locked_manual_change', true), 'false') <> 'true' then
    raise exception 'LOCKED_APPOINTMENT: gli appuntamenti bloccati non possono essere spostati o eliminati';
  end if;
  return new;
end $$;

drop trigger if exists protect_locked_appointment_trigger on public.appointments;
create trigger protect_locked_appointment_trigger before update on public.appointments
for each row execute function public.protect_locked_appointment();

do $$
declare t text;
begin
  foreach t in array array['doctors','appointments','imports','import_staging','change_sets','healthcare_facilities','weekly_plans','visit_product_goals'] loop
    execute format('drop trigger if exists audit_%I on public.%I', t, t);
    execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.audit_owned_row()', t, t);
  end loop;
end $$;

create or replace function public.create_data_snapshot(p_type text default 'manual', p_change_set_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
declare result uuid;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.data_snapshots(user_id, snapshot_type, change_set_id, created_by, payload)
  values(uid, p_type, p_change_set_id, uid, jsonb_build_object(
    'version', 1,
    'doctors', (select coalesce(jsonb_agg(to_jsonb(d)), '[]') from public.doctors d where d.user_id = uid),
    'appointments', (select coalesce(jsonb_agg(to_jsonb(a)), '[]') from public.appointments a where a.user_id = uid),
    'products', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from public.products p where p.user_id = uid),
    'microarea_targets', (select coalesce(jsonb_agg(to_jsonb(m)), '[]') from public.microarea_targets m where m.user_id = uid),
    'settings', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.user_settings s where s.user_id = uid)
  )) returning id into result;
  return result;
end $$;

create or replace function public.soft_delete_appointment(p_appointment_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  perform set_config('medplanner.allow_locked_manual_change', 'true', true);
  update public.appointments set deleted_at = now(), deleted_by = uid,
    delete_reason = nullif(trim(p_reason), ''), planning_status = 'annullato', source = 'manuale'
  where id = p_appointment_id and user_id = uid and deleted_at is null;
  if not found then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
end $$;

create or replace function public.restore_appointment(p_appointment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  perform public.create_data_snapshot('manual', null);
  perform set_config('medplanner.allow_locked_manual_change', 'true', true);
  update public.appointments set deleted_at = null, deleted_by = null, delete_reason = null,
    planning_status = 'programmato', is_locked = true, locked_reason = 'Ripristinato manualmente', source = 'manuale'
  where id = p_appointment_id and user_id = uid and deleted_at is not null;
  if not found then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
end $$;

create or replace function public.approve_weekly_plan(p_plan_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
declare affected integer;
declare cs uuid;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select change_set_id into cs from public.weekly_plans where id = p_plan_id and user_id = uid for update;
  if not found then raise exception 'PLAN_NOT_FOUND'; end if;
  perform public.create_data_snapshot('pre_changeset', cs);
  update public.appointments set planning_status = 'programmato', status = 'programmato', is_locked = true,
    locked_reason = 'Piano settimanale approvato', source = 'manuale'
  where user_id = uid and change_set_id = cs and planning_status = 'proposto' and deleted_at is null;
  get diagnostics affected = row_count;
  update public.weekly_plans set status = 'approvato', updated_at = now() where id = p_plan_id;
  update public.change_sets set status = 'applicato', applied_at = now() where id = cs and user_id = uid;
  return affected;
end $$;

create or replace function public.daily_sample_bag(p_date date)
returns table(product_id uuid, product_name text, samples bigint) language sql security definer set search_path = public as $$
  select p.id, p.name, sum(g.patient_goal)::bigint
  from public.visit_product_goals g
  join public.appointments a on a.id = g.appointment_id and a.user_id = auth.uid()
  join public.products p on p.id = g.product_id and p.user_id = auth.uid()
  where g.user_id = auth.uid() and a.date = p_date and a.deleted_at is null
    and a.planning_status in ('programmato','confermato','completato')
  group by p.id, p.name order by p.name
$$;

create or replace function public.apply_certain_doctor_import(p_import_id uuid, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
declare cs uuid;
declare row_record record;
declare inserted_count integer := 0;
declare updated_count integer := 0;
declare candidate jsonb;
declare protected_fields text[];
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(trim(p_idempotency_key), '') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  perform 1 from public.imports where id = p_import_id and user_id = uid and import_type = 'schedario' for update;
  if not found then raise exception 'IMPORT_NOT_FOUND'; end if;
  select id into cs from public.change_sets where user_id = uid and idempotency_key = p_idempotency_key;
  if cs is not null then
    return (select summary from public.change_sets where id = cs);
  end if;
  insert into public.change_sets(user_id, kind, status, source, idempotency_key, summary)
  values(uid, 'import', 'pronto', 'importazione', p_idempotency_key, jsonb_build_object('import_id', p_import_id)) returning id into cs;
  perform public.create_data_snapshot('pre_import', cs);

  for row_record in select * from public.import_staging
    where import_id = p_import_id and user_id = uid and classification in ('nuovo_certo','aggiornamento_certo') and applied_at is null
    order by row_number for update
  loop
    candidate := row_record.normalized_data;
    if row_record.classification = 'nuovo_certo' then
      insert into public.doctors(user_id, name, normalized_name, specialty, paese, microarea, address, external_source, external_id, sync_status, source_updated_at)
      values(uid, candidate->>'name', candidate->>'normalizedName', coalesce(nullif(candidate->>'specialty',''),'MMG'),
        coalesce(candidate->>'paese',''), coalesce(candidate->>'microarea',''), coalesce(candidate->>'address',''),
        'schedario_upload', nullif(candidate->>'externalId',''), 'sincronizzato', now());
      inserted_count := inserted_count + 1;
    else
      select manual_fields into protected_fields from public.doctors where id = row_record.matched_doctor_id and user_id = uid;
      update public.doctors set
        specialty = case when 'specialty'=any(protected_fields) then specialty else coalesce(nullif(candidate->>'specialty',''), specialty) end,
        paese = case when 'paese'=any(protected_fields) then paese else coalesce(nullif(candidate->>'paese',''), paese) end,
        microarea = case when 'microarea'=any(protected_fields) then microarea else coalesce(nullif(candidate->>'microarea',''), microarea) end,
        address = case when 'address'=any(protected_fields) then address else coalesce(nullif(candidate->>'address',''), address) end,
        external_source = coalesce(external_source, 'schedario_upload'),
        external_id = coalesce(external_id, nullif(candidate->>'externalId','')),
        sync_status = 'sincronizzato', source_updated_at = now()
      where id = row_record.matched_doctor_id and user_id = uid;
      updated_count := updated_count + 1;
    end if;
    update public.import_staging set applied_at = now() where id = row_record.id;
  end loop;
  update public.imports set status = case when exists(select 1 from public.import_staging where import_id=p_import_id and classification in ('possibile_duplicato','incompleto_ambiguo')) then 'da_revisionare' else 'applicato' end,
    applied_at = now(), report = jsonb_build_object('inserted',inserted_count,'updated',updated_count) where id=p_import_id;
  update public.change_sets set status='applicato', applied_at=now(), summary=jsonb_build_object('import_id',p_import_id,'inserted',inserted_count,'updated',updated_count) where id=cs;
  return jsonb_build_object('change_set_id',cs,'inserted',inserted_count,'updated',updated_count);
end $$;

revoke execute on function public.create_data_snapshot(text, uuid) from anon, public;
revoke execute on function public.soft_delete_appointment(uuid, text) from anon, public;
revoke execute on function public.restore_appointment(uuid) from anon, public;
revoke execute on function public.approve_weekly_plan(uuid) from anon, public;
revoke execute on function public.daily_sample_bag(date) from anon, public;
revoke execute on function public.apply_certain_doctor_import(uuid, text) from anon, public;
grant execute on function public.create_data_snapshot(text, uuid) to authenticated;
grant execute on function public.soft_delete_appointment(uuid, text) to authenticated;
grant execute on function public.restore_appointment(uuid) to authenticated;
grant execute on function public.approve_weekly_plan(uuid) to authenticated;
grant execute on function public.daily_sample_bag(date) to authenticated;
grant execute on function public.apply_certain_doctor_import(uuid, text) to authenticated;

create trigger update_facilities_updated_at before update on public.healthcare_facilities
for each row execute function public.update_updated_at_column();
create trigger update_weekly_plans_updated_at before update on public.weekly_plans
for each row execute function public.update_updated_at_column();

-- Rollback notes: drop the new functions/tables/triggers, then drop the added columns.
-- The backfilled lock/status values are intentionally retained unless restored from a snapshot.
