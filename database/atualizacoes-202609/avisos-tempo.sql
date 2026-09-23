begin;
create table if not exists public.clube_avisos_config (
 clube_id uuid primary key references public.configuracao_clube(id) on delete cascade,
 tempo_segundos integer not null default 0 check(tempo_segundos between 0 and 60),
 atualizado_por uuid not null,
 atualizado_em timestamptz not null default now()
);
alter table public.clube_avisos_config enable row level security;
revoke all on public.clube_avisos_config from anon,authenticated;
grant all on public.clube_avisos_config to service_role;
commit;
notify pgrst,'reload schema';
