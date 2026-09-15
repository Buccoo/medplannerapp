-- Personal, revocable credentials for the remote MCP endpoint.
-- Raw tokens are never persisted: only their SHA-256 digest is stored.

create table if not exists public.mcp_access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  token_prefix text not null check (char_length(token_prefix) between 6 and 20),
  scopes text[] not null default array['read','propose']::text[],
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mcp_access_tokens_scopes_check check (
    scopes <@ array['read','propose']::text[] and 'read' = any(scopes)
  )
);

alter table public.mcp_access_tokens enable row level security;
create policy "Users can view own MCP tokens" on public.mcp_access_tokens
  for select using (auth.uid() = user_id);

revoke all on public.mcp_access_tokens from anon, authenticated;
grant select (id,name,token_prefix,scopes,expires_at,revoked_at,last_used_at,created_at)
  on public.mcp_access_tokens to authenticated;

create or replace function public.create_mcp_access_token(
  p_name text,
  p_token_hash text,
  p_token_prefix text,
  p_expires_at timestamptz default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); token_id uuid;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_TOKEN_HASH'; end if;
  if p_expires_at is not null and p_expires_at <= now() then raise exception 'INVALID_EXPIRY'; end if;
  insert into public.mcp_access_tokens(user_id,name,token_hash,token_prefix,expires_at)
    values(uid,trim(p_name),p_token_hash,p_token_prefix,p_expires_at)
    returning id into token_id;
  return token_id;
end $$;

create or replace function public.revoke_mcp_access_token(p_token_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare affected integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.mcp_access_tokens set revoked_at=coalesce(revoked_at,now())
    where id=p_token_id and user_id=auth.uid();
  get diagnostics affected=row_count;
  return affected=1;
end $$;

-- The MCP function runs with service_role. These wrappers temporarily establish
-- the token owner's identity so existing, audited planning functions keep their
-- original ownership checks and transactional behavior.
create or replace function public.mcp_generate_weekly_plan(p_user_id uuid, p_week_start date, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  perform set_config('request.jwt.claim.sub',p_user_id::text,true);
  return public.generate_weekly_plan(p_week_start,p_idempotency_key);
end $$;

create or replace function public.mcp_daily_sample_bag(p_user_id uuid, p_date date)
returns table(product_id uuid, product_name text, samples bigint)
language plpgsql security definer set search_path=public as $$
begin
  perform set_config('request.jwt.claim.sub',p_user_id::text,true);
  return query select * from public.daily_sample_bag(p_date);
end $$;

revoke execute on function public.create_mcp_access_token(text,text,text,timestamptz),
  public.revoke_mcp_access_token(uuid), public.mcp_generate_weekly_plan(uuid,date,text),
  public.mcp_daily_sample_bag(uuid,date) from anon,public,authenticated;
grant execute on function public.create_mcp_access_token(text,text,text,timestamptz),
  public.revoke_mcp_access_token(uuid) to authenticated;
grant execute on function public.mcp_generate_weekly_plan(uuid,date,text),
  public.mcp_daily_sample_bag(uuid,date) to service_role;

