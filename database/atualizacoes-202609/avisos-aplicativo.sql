-- Avisos ilustrados: publicação por clube e fechamento persistente por associado.
begin;
create table if not exists public.clube_avisos (
 id uuid primary key,
 clube_id uuid not null references public.configuracao_clube(id) on delete cascade,
 titulo text not null check(char_length(titulo) between 3 and 120),
 descricao text not null default '' check(char_length(descricao)<=2000),
 imagem text not null check(length(imagem) between 1 and 2800000),
 ativo boolean not null default false,
 expira_em timestamptz,
 criado_em timestamptz not null default now(),
 publicado_em timestamptz,
 criado_por uuid not null,
 atualizado_por uuid not null,
 atualizado_em timestamptz not null default now()
);
create index if not exists clube_avisos_clube_ativos on public.clube_avisos(clube_id,ativo,publicado_em desc);
create table if not exists public.clube_avisos_fechamentos (
 aviso_id uuid not null references public.clube_avisos(id) on delete cascade,
 associado_id uuid not null references public.associados(id) on delete cascade,
 fechado_em timestamptz not null default now(),
 primary key(aviso_id,associado_id)
);
alter table public.clube_avisos enable row level security;
alter table public.clube_avisos_fechamentos enable row level security;
revoke all on public.clube_avisos, public.clube_avisos_fechamentos from anon,authenticated;
grant all on public.clube_avisos, public.clube_avisos_fechamentos to service_role;
commit;
notify pgrst,'reload schema';
