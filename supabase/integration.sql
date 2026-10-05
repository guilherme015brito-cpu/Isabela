-- Isabela: armazenamento privado, sincronização atômica e controle de versão.
-- Execute no SQL Editor. O e-mail autorizado é provisionado separadamente
-- em private.isabela_allowed_emails e não deve ser publicado no repositório.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.isabela_allowed_emails (
  email text primary key check (email = lower(email))
);
revoke all on private.isabela_allowed_emails from public, anon, authenticated;

create table if not exists public.isabela_sync_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.isabela_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object')
);
do $$
declare table_name text;
begin
  foreach table_name in array array['isabela_tasks','isabela_categories',
    'isabela_finance_categories','isabela_banks','isabela_transactions',
    'isabela_projects','isabela_import_batches'] loop
    execute format('create table if not exists public.%I (
      owner_id uuid not null references auth.users(id) on delete cascade,
      id text not null check (length(id) between 1 and 180),
      position integer not null,
      data jsonb not null check (jsonb_typeof(data) = ''object''),
      primary key (owner_id, id))', table_name);
  end loop;
  foreach table_name in array array['isabela_tasks','isabela_categories',
    'isabela_finance_categories','isabela_banks','isabela_transactions',
    'isabela_projects','isabela_import_batches','isabela_settings','isabela_sync_state'] loop
    execute format('alter table public.%I enable row level security', table_name);
    -- Acesso somente pelas funções abaixo, nunca diretamente às tabelas.
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
  end loop;
end $$;

create or replace function private.isabela_owner()
returns uuid language plpgsql security definer set search_path = pg_catalog as $$
declare owner uuid := auth.uid();
begin
  if owner is null or not exists (
    select 1 from auth.users u
    join private.isabela_allowed_emails a on a.email = lower(u.email)
    where u.id = owner and u.email_confirmed_at is not null
  ) then
    raise exception 'Ative o app com o e-mail autorizado.' using errcode = '42501';
  end if;
  return owner;
end $$;
revoke all on function private.isabela_owner() from public, anon, authenticated;

create or replace function private.isabela_snapshot(owner uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog as $$
declare result jsonb := '{}'::jsonb; collection text; table_name text; items jsonb;
begin
  for collection, table_name in select * from (values
    ('tasks','isabela_tasks'), ('categories','isabela_categories'),
    ('financeCategories','isabela_finance_categories'), ('banks','isabela_banks'),
    ('transactions','isabela_transactions'), ('projects','isabela_projects'),
    ('importBatches','isabela_import_batches')) as names(collection, table_name) loop
    execute format('select coalesce(jsonb_agg(data order by position), ''[]''::jsonb)
      from public.%I where owner_id = $1', table_name) into items using owner;
    result := result || jsonb_build_object(collection, items);
  end loop;
  select data into items from public.isabela_settings where owner_id = owner;
  return result || jsonb_build_object('settings', coalesce(items, '{}'::jsonb));
end $$;
revoke all on function private.isabela_snapshot(uuid) from public, anon, authenticated;

create or replace function public.isabela_load()
returns jsonb language plpgsql security definer set search_path = pg_catalog as $$
declare owner uuid := private.isabela_owner(); state public.isabela_sync_state%rowtype;
begin
  -- O bloqueio impede ler uma revisão junto de coleções de outra revisão.
  select * into state from public.isabela_sync_state where owner_id = owner for share;
  if not found then
    return jsonb_build_object('revision', 0, 'data', null, 'updated_at', null);
  end if;
  return jsonb_build_object('revision', state.revision, 'updated_at', state.updated_at,
    'data', private.isabela_snapshot(owner));
end $$;

create or replace function public.isabela_sync(expected_revision bigint, document jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog as $$
declare owner uuid := private.isabela_owner(); state public.isabela_sync_state%rowtype;
  collection text; table_name text; item jsonb; items jsonb; changed_at timestamptz;
begin
  if expected_revision is null or expected_revision < 0 or
    jsonb_typeof(document) is distinct from 'object' or
    jsonb_typeof(document->'settings') is distinct from 'object' or
    octet_length(document::text) > 5000000 then
    raise exception 'Cópia de dados inválida ou muito grande.' using errcode = '22023';
  end if;
  foreach collection in array array['tasks','categories','financeCategories','banks',
    'transactions','projects','importBatches'] loop
    items := document->collection;
    if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) > 10000 then
      raise exception 'Coleção inválida: %', collection using errcode = '22023';
    end if;
    for item in select value from jsonb_array_elements(items) loop
      if jsonb_typeof(item) is distinct from 'object' or
        jsonb_typeof(item->'id') is distinct from 'string' or
        length(item->>'id') not between 1 and 180 then
        raise exception 'Registro inválido: %', collection using errcode = '22023';
      end if;
    end loop;
    if (select count(*) <> count(distinct value->>'id') from jsonb_array_elements(items)) then
      raise exception 'Identificadores repetidos: %', collection using errcode = '22023';
    end if;
  end loop;
  for item in select value from jsonb_array_elements(document->'tasks') loop
    if nullif(trim(item->>'name'), '') is null or jsonb_typeof(item->'done') is distinct from 'boolean'
      or (item->>'date')::date is null then
      raise exception 'Tarefa inválida.' using errcode = '22023';
    end if;
    if nullif(item->>'end','') is not null and (item->>'end')::date < (item->>'date')::date then
      raise exception 'Intervalo de tarefa inválido.' using errcode = '22023';
    end if;
  end loop;
  for item in select value from jsonb_array_elements(document->'banks') loop
    if jsonb_typeof(item->'initial') is distinct from 'number' or nullif(trim(item->>'name'),'') is null then
      raise exception 'Banco inválido.' using errcode = '22023';
    end if;
  end loop;
  for item in select value from jsonb_array_elements(document->'projects') loop
    if jsonb_typeof(item->'target') is distinct from 'number' or (item->>'target')::numeric <= 0 then
      raise exception 'Meta inválida.' using errcode = '22023';
    end if;
  end loop;
  for item in select value from jsonb_array_elements(document->'transactions') loop
    if jsonb_typeof(item->'amount') is distinct from 'number' or (item->>'amount')::numeric <= 0
      or coalesce(item->>'type','') not in ('in','out') or (item->>'date')::date is null
      or not exists (select 1 from jsonb_array_elements(document->'banks') b where b->>'id' = item->>'bank')
      or (nullif(item->>'project','') is not null and not exists
        (select 1 from jsonb_array_elements(document->'projects') p where p->>'id' = item->>'project')) then
      raise exception 'Transação inválida ou sem banco/plano correspondente.' using errcode = '22023';
    end if;
  end loop;
  insert into public.isabela_sync_state(owner_id) values(owner) on conflict do nothing;
  select * into state from public.isabela_sync_state where owner_id = owner for update;
  if state.revision <> expected_revision then
    return jsonb_build_object('conflict', true, 'revision', state.revision,
      'updated_at', state.updated_at, 'data', private.isabela_snapshot(owner));
  end if;
  for collection, table_name in select * from (values
    ('tasks','isabela_tasks'), ('categories','isabela_categories'),
    ('financeCategories','isabela_finance_categories'), ('banks','isabela_banks'),
    ('transactions','isabela_transactions'), ('projects','isabela_projects'),
    ('importBatches','isabela_import_batches')) as names(collection, table_name) loop
    items := document->collection;
    execute format('insert into public.%I(owner_id, id, position, data)
      select $1, value->>''id'', (ordinality-1)::integer, value
      from jsonb_array_elements($2) with ordinality
      on conflict (owner_id, id) do update set position=excluded.position, data=excluded.data', table_name)
      using owner, items;
    execute format('delete from public.%I where owner_id=$1 and not exists
      (select 1 from jsonb_array_elements($2) entry where entry->>''id''=id)', table_name)
      using owner, items;
  end loop;
  insert into public.isabela_settings(owner_id, data) values(owner, document->'settings')
    on conflict(owner_id) do update set data=excluded.data;
  changed_at := clock_timestamp();
  update public.isabela_sync_state set revision=revision+1, updated_at=changed_at
    where owner_id=owner returning * into state;
  return jsonb_build_object('revision', state.revision, 'updated_at', state.updated_at,
    'data', private.isabela_snapshot(owner));
end $$;
revoke all on function public.isabela_load() from public, anon, authenticated;
revoke all on function public.isabela_sync(bigint,jsonb) from public, anon, authenticated;
grant execute on function public.isabela_load() to authenticated;
grant execute on function public.isabela_sync(bigint,jsonb) to authenticated;
commit;
