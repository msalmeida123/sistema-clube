-- Fundo público do login, separado das cores e do ícone do clube.
-- A API administrativa identifica o clube pela sessão; a leitura pública pelo domínio.
create table if not exists public.clube_fundo_login (
 clube_id uuid primary key references public.configuracao_clube(id) on delete cascade,
 dados text not null check(length(dados) <= 2800000),
 versao uuid not null default gen_random_uuid(),
 atualizado_por uuid not null,
 atualizado_em timestamptz not null default now()
);
alter table public.clube_fundo_login enable row level security;
revoke all on public.clube_fundo_login from anon, authenticated;
grant all on public.clube_fundo_login to service_role;
notify pgrst, 'reload schema';
