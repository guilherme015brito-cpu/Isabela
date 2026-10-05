-- Execute uma vez no SQL Editor do projeto Isabela.
-- A tabela contém somente um número fixo; nenhuma informação pessoal.
begin;

create table if not exists public.app_healthcheck (
  id smallint primary key check (id = 1)
);

insert into public.app_healthcheck (id) values (1)
on conflict (id) do nothing;

alter table public.app_healthcheck enable row level security;
revoke all on table public.app_healthcheck from anon, authenticated;
grant select on table public.app_healthcheck to anon;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'app_healthcheck'
      and policyname = 'Healthcheck read only'
  ) then
    create policy "Healthcheck read only"
      on public.app_healthcheck for select to anon using (id = 1);
  end if;
end $$;

commit;
