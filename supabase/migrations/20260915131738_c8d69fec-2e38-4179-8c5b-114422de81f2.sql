alter table public.coverage_inputs drop constraint if exists coverage_inputs_user_id_input_type_cycle_start_microarea_product_id_key;
alter table public.coverage_inputs drop constraint if exists coverage_inputs_user_id_input_type_cycle_start_microarea_pr_key;
create unique index if not exists coverage_inputs_identity_idx on public.coverage_inputs
  (user_id,input_type,cycle_start,microarea,product_id) nulls not distinct;

create table if not exists public.coverage_import_staging (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  import_id uuid not null references public.imports(id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  normalized_data jsonb not null,
  classification text not null check (classification in ('certo','incompleto_ambiguo')),
  error_message text,
  applied_at timestamptz,
  unique(import_id, row_number)
);

create table if not exists public.doctor_product_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  patient_goal integer not null default 0 check (patient_goal >= 0),
  priority integer not null default 0,
  rationale text not null default '',
  source_import_id uuid references public.imports(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, doctor_id, product_id)
);

create table if not exists public.plan_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  conflict_type text not null,
  severity text not null default 'warning' check (severity in ('warning','blocking')),
  message text not null,
  context jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.change_set_items (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  change_set_id uuid not null references public.change_sets(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('insert','update','soft_delete')),
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['coverage_import_staging','doctor_product_rules','plan_conflicts','change_set_items'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

revoke insert, update, delete on public.change_set_items from authenticated;

create or replace function public.apply_coverage_import(p_import_id uuid, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
declare cs uuid;
declare r record;
declare applied integer := 0;
declare input_kind text;
declare product uuid;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  select import_type into input_kind from public.imports where id=p_import_id and user_id=uid and import_type in ('ab_plan','ro','ims') for update;
  if not found then raise exception 'IMPORT_NOT_FOUND'; end if;
  select id into cs from public.change_sets where user_id=uid and idempotency_key=p_idempotency_key;
  if cs is not null then return (select summary from public.change_sets where id=cs); end if;
  insert into public.change_sets(user_id,kind,status,source,idempotency_key,summary)
    values(uid,'import','pronto','importazione',p_idempotency_key,jsonb_build_object('import_id',p_import_id)) returning id into cs;
  perform public.create_data_snapshot('pre_import',cs);
  for r in select * from public.coverage_import_staging where import_id=p_import_id and user_id=uid and classification='certo' and applied_at is null order by row_number for update loop
    product := null;
    if nullif(r.normalized_data->>'product','') is not null then
      select id into product from public.products where user_id=uid and lower(trim(name))=lower(trim(r.normalized_data->>'product')) limit 1;
      if product is null then continue; end if;
    end if;
    insert into public.coverage_inputs(user_id,input_type,cycle_start,cycle_end,microarea,product_id,planned_days,target_value,actual_value,source_import_id,metadata)
    values(uid,input_kind,(r.normalized_data->>'cycle_start')::date,(r.normalized_data->>'cycle_end')::date,upper(r.normalized_data->>'microarea'),product,
      nullif(r.normalized_data->>'planned_days','')::numeric,nullif(r.normalized_data->>'target_value','')::numeric,
      nullif(r.normalized_data->>'actual_value','')::numeric,p_import_id,r.normalized_data)
    on conflict (user_id,input_type,cycle_start,microarea,product_id) do update
      set cycle_end=excluded.cycle_end, planned_days=excluded.planned_days, target_value=excluded.target_value,
          actual_value=excluded.actual_value, source_import_id=excluded.source_import_id, metadata=excluded.metadata;
    update public.coverage_import_staging set applied_at=now() where id=r.id;
    applied := applied + 1;
  end loop;
  update public.imports set status='applicato',
    applied_at=now(),report=jsonb_build_object('applied',applied) where id=p_import_id;
  update public.change_sets set status='applicato',applied_at=now(),summary=jsonb_build_object('import_id',p_import_id,'applied',applied) where id=cs;
  return jsonb_build_object('change_set_id',cs,'applied',applied);
end $$;

create or replace function public.generate_weekly_plan(p_week_start date, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
declare plan_id uuid; declare cs uuid; declare day_date date; declare area text; declare slot text;
declare doctor_row record; declare facility_row record; declare appointment_id uuid; declare proposals integer:=0; declare conflicts integer:=0;
declare slots text[] := array['09:00','10:00','11:00','13:00','15:00','16:00'];
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if extract(isodow from p_week_start)<>1 then raise exception 'WEEK_START_MUST_BE_MONDAY'; end if;
  select id into cs from public.change_sets where user_id=uid and idempotency_key=p_idempotency_key;
  if cs is not null then return (select summary from public.change_sets where id=cs); end if;
  insert into public.change_sets(user_id,kind,status,source,idempotency_key) values(uid,'weekly_plan','bozza','ai',p_idempotency_key) returning id into cs;
  insert into public.weekly_plans(user_id,week_start,status,change_set_id,rationale) values(uid,p_week_start,'proposto',cs,'{}')
    on conflict(user_id,week_start) do update set status='proposto',change_set_id=excluded.change_set_id,updated_at=now() returning id into plan_id;
  delete from public.plan_conflicts where weekly_plan_id=plan_id;
  for day_offset in 0..4 loop
    day_date:=p_week_start+day_offset;
    select c.microarea into area from public.coverage_inputs c where c.user_id=uid and c.cycle_start<=day_date and c.cycle_end>=day_date
      group by c.microarea order by (coalesce(max(c.planned_days),0)-count(*) filter(where c.input_type='ab_plan')) desc,
      sum(greatest(coalesce(c.target_value,0)-coalesce(c.actual_value,0),0)) desc, c.microarea limit 1;
    if area is null then
      select d.microarea into area from public.doctors d where d.user_id=uid and nullif(trim(d.microarea),'') is not null group by d.microarea order by count(*) desc limit 1;
    end if;
    if area is null then
      insert into public.plan_conflicts(user_id,weekly_plan_id,conflict_type,severity,message,context) values(uid,plan_id,'missing_microarea','blocking','Nessuna microarea disponibile',jsonb_build_object('date',day_date)); conflicts:=conflicts+1; continue;
    end if;
    insert into public.weekly_plan_days(user_id,weekly_plan_id,plan_date,microarea) values(uid,plan_id,day_date,area)
      on conflict(weekly_plan_id,plan_date) do update set microarea=excluded.microarea;
    select f.* into facility_row from public.healthcare_facilities f where f.user_id=uid and f.active and f.structure_slot_enabled and f.microarea=area
      order by case f.facility_type when 'ospedale' then 1 when 'asl' then 2 when 'clinica_privata' then 3 else 4 end limit 1;
    if facility_row.id is null then
      insert into public.plan_conflicts(user_id,weekly_plan_id,conflict_type,severity,message,context) values(uid,plan_id,'missing_structure','blocking','Manca una struttura abilitata nella microarea',jsonb_build_object('date',day_date,'microarea',area)); conflicts:=conflicts+1;
    end if;
    foreach slot in array slots loop
      if exists(select 1 from public.appointments a where a.user_id=uid and a.date=day_date and a.time=slot and a.deleted_at is null) then continue; end if;
      doctor_row:=null;
      if slot='13:00' then
        if facility_row.id is null then continue; end if;
        select d.*,df.facility_id into doctor_row from public.doctors d join public.doctor_facilities df on df.doctor_id=d.id and df.user_id=uid
          where d.user_id=uid and df.facility_id=facility_row.id and not exists(select 1 from public.appointments a where a.user_id=uid and (a.doctor_id=d.id or lower(trim(a.name))=lower(trim(d.name))) and a.date between p_week_start and p_week_start+4 and a.deleted_at is null) order by d.last_visit_date nulls first limit 1;
      else
        select d.* into doctor_row from public.doctors d where d.user_id=uid and d.microarea=area and not exists(select 1 from public.appointments a where a.user_id=uid and (a.doctor_id=d.id or lower(trim(a.name))=lower(trim(d.name))) and a.date between p_week_start and p_week_start+4 and a.deleted_at is null) order by d.last_visit_date nulls first limit 1;
      end if;
      if doctor_row.id is null then continue; end if;
      insert into public.appointments(user_id,date,time,name,type,status,planning_status,is_locked,source,change_set_id,doctor_id,address,paese,microarea)
      values(uid,day_date,slot,doctor_row.name,'medico','programmato','proposto',false,'ai',cs,doctor_row.id,
        case when slot='13:00' then facility_row.address else doctor_row.address end,
        case when slot='13:00' then facility_row.paese else doctor_row.paese end,area) returning id into appointment_id;
      insert into public.visit_product_goals(user_id,weekly_plan_id,appointment_id,doctor_id,product_id,patient_goal,priority,rationale)
        select uid,plan_id,appointment_id,doctor_row.id,r.product_id,r.patient_goal,r.priority,r.rationale from public.doctor_product_rules r where r.user_id=uid and r.doctor_id=doctor_row.id;
      proposals:=proposals+1;
    end loop;
  end loop;
  update public.change_sets set status='pronto',summary=jsonb_build_object('plan_id',plan_id,'proposals',proposals,'conflicts',conflicts) where id=cs;
  update public.weekly_plans set rationale=jsonb_build_object('proposals',proposals,'conflicts',conflicts) where id=plan_id;
  return jsonb_build_object('plan_id',plan_id,'change_set_id',cs,'proposals',proposals,'conflicts',conflicts);
end $$;

create or replace function public.restore_change_set(p_change_set_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid:=auth.uid(); declare restored integer:=0;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  perform 1 from public.change_sets where id=p_change_set_id and user_id=uid and status='applicato' for update;
  if not found then raise exception 'CHANGESET_NOT_RESTORABLE'; end if;
  perform public.create_data_snapshot('manual',p_change_set_id);
  perform set_config('medplanner.allow_locked_manual_change','true',true);
  update public.appointments set deleted_at=now(),deleted_by=uid,delete_reason='Ripristino changeset',planning_status='annullato'
    where user_id=uid and change_set_id=p_change_set_id and source in ('ai','bulk','importazione') and deleted_at is null;
  get diagnostics restored=row_count;
  update public.change_sets set status='ripristinato' where id=p_change_set_id;
  return jsonb_build_object('restored_appointments',restored,'note','Gli aggiornamenti import sono conservati; usare lo snapshot pre-import per un ripristino dati assistito.');
end $$;

create or replace function public.resolve_import_row(p_row_id uuid, p_resolution text)
returns void language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); declare staged public.import_staging%rowtype; declare cs uuid; declare new_doctor uuid;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_resolution not in ('nuovo_certo','ignora') then raise exception 'INVALID_RESOLUTION'; end if;
  select * into staged from public.import_staging where id=p_row_id and user_id=uid and classification in ('possibile_duplicato','incompleto_ambiguo') for update;
  if not found then raise exception 'ROW_NOT_FOUND'; end if;
  if p_resolution='nuovo_certo' then
    if nullif(staged.normalized_data->>'name','') is null or nullif(staged.normalized_data->>'microarea','') is null then raise exception 'INCOMPLETE_ROW'; end if;
    insert into public.change_sets(user_id,kind,status,source,idempotency_key,summary,applied_at)
      values(uid,'import','applicato','manuale','review:'||p_row_id,jsonb_build_object('review_row_id',p_row_id),now()) returning id into cs;
    perform public.create_data_snapshot('pre_import',cs);
    insert into public.doctors(user_id,name,normalized_name,specialty,paese,microarea,address,external_source,external_id,sync_status,source_updated_at)
      values(uid,staged.normalized_data->>'name',staged.normalized_data->>'normalizedName',coalesce(nullif(staged.normalized_data->>'specialty',''),'MMG'),
      coalesce(staged.normalized_data->>'paese',''),staged.normalized_data->>'microarea',coalesce(staged.normalized_data->>'address',''),
      'schedario_upload',nullif(staged.normalized_data->>'externalId',''),'revisionato',now()) returning id into new_doctor;
    insert into public.change_set_items(user_id,change_set_id,entity_type,entity_id,action,new_values)
      select uid,cs,'doctors',new_doctor,'insert',to_jsonb(d) from public.doctors d where d.id=new_doctor;
  end if;
  update public.import_staging set resolution=p_resolution,classification=case when p_resolution='nuovo_certo' then 'nuovo_certo' else classification end,applied_at=now() where id=p_row_id;
end $$;

create or replace function public.create_daily_snapshots_all_users()
returns integer language plpgsql security definer set search_path=public as $$
declare u record; declare total integer:=0;
begin
  for u in select distinct user_id from public.user_settings loop
    if not exists(select 1 from public.data_snapshots where user_id=u.user_id and snapshot_type='daily' and created_at::date=current_date) then
      insert into public.data_snapshots(user_id,snapshot_type,payload) values(u.user_id,'daily',jsonb_build_object(
        'version',1,'doctors',(select coalesce(jsonb_agg(to_jsonb(d)),'[]') from public.doctors d where d.user_id=u.user_id),
        'appointments',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.appointments a where a.user_id=u.user_id),
        'products',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from public.products p where p.user_id=u.user_id),
        'coverage_inputs',(select coalesce(jsonb_agg(to_jsonb(c)),'[]') from public.coverage_inputs c where c.user_id=u.user_id),
        'settings',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.user_settings s where s.user_id=u.user_id)));
      total:=total+1;
    end if;
  end loop; return total;
end $$;

revoke execute on function public.apply_coverage_import(uuid,text), public.generate_weekly_plan(date,text), public.restore_change_set(uuid) from anon,public;
revoke execute on function public.resolve_import_row(uuid,text) from anon,public;
grant execute on function public.apply_coverage_import(uuid,text), public.generate_weekly_plan(date,text), public.restore_change_set(uuid), public.resolve_import_row(uuid,text) to authenticated;
revoke all on function public.create_daily_snapshots_all_users() from anon,authenticated,public;
grant execute on function public.create_daily_snapshots_all_users() to service_role;

do $$ begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron non disponibile: %', sqlerrm;
  end;
  begin
    if not exists(select 1 from cron.job where jobname='medplanner-daily-snapshot') then
      perform cron.schedule('medplanner-daily-snapshot','15 2 * * *','select public.create_daily_snapshots_all_users()');
    end if;
  exception when others then
    raise notice 'schedulazione snapshot non applicata: %', sqlerrm;
  end;
end $$;

revoke execute on function public.jsonb_diff(jsonb,jsonb) from anon;
revoke execute on function public.audit_owned_row() from anon, authenticated;
revoke execute on function public.protect_locked_appointment() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_new_user_settings() from anon, authenticated;
revoke execute on function public.update_updated_at_column() from anon, authenticated;