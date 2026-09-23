-- Homologação isolada: estas tabelas não têm vínculo com mensalidades reais.
begin;
create table if not exists public.asaas_sandbox_cobrancas (
 id text primary key,
 referencia text not null unique,
 cliente text not null,
 valor numeric(12,2) not null check(valor > 0),
 status text not null default 'PENDING',
 atualizado_em timestamptz not null default now()
);
create table if not exists public.asaas_sandbox_eventos (
 id text primary key,
 cobranca text not null references public.asaas_sandbox_cobrancas(id),
 evento text not null,
 recebido_em timestamptz not null default now()
);
alter table public.asaas_sandbox_cobrancas enable row level security;
alter table public.asaas_sandbox_eventos enable row level security;
revoke all on public.asaas_sandbox_cobrancas, public.asaas_sandbox_eventos from anon, authenticated;
grant select,insert,update on public.asaas_sandbox_cobrancas, public.asaas_sandbox_eventos to service_role;
create or replace function public.asaas_sandbox_confirmar(p_evento text,p_tipo text,p_cobranca text,p_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform 1 from asaas_sandbox_cobrancas where id=p_cobranca for update;
 if not found then raise exception 'cobranca_desconhecida'; end if;
 insert into asaas_sandbox_eventos(id,cobranca,evento) values(p_evento,p_cobranca,p_tipo) on conflict do nothing;
 if found then
  update asaas_sandbox_cobrancas set status=p_status,atualizado_em=now() where id=p_cobranca;
 end if;
end $$;
revoke all on function public.asaas_sandbox_confirmar(text,text,text,text) from public,anon,authenticated;
grant execute on function public.asaas_sandbox_confirmar(text,text,text,text) to service_role;
commit;
