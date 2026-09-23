-- Fora de transação: criação concorrente permite gravações durante o índice.
SET statement_timeout='30min';
SELECT format('DROP INDEX CONCURRENTLY public.%I;', c.relname) FROM pg_class c JOIN pg_index i ON i.indexrelid=c.oid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT i.indisvalid AND c.relname IN ('perf_piscina_historico','perf_academia_historico','perf_exame_piscina','perf_assinatura_ativa','perf_mensalidade_assinatura','perf_convite_entradas','perf_mensagens_hora','perf_contatos_pendentes');
\gexec

CREATE INDEX CONCURRENTLY IF NOT EXISTS perf_piscina_historico ON public.acessos_piscina (data_hora DESC,id DESC) ;
CREATE INDEX CONCURRENTLY IF NOT EXISTS perf_academia_historico ON public.acessos_academia (data_hora DESC,id DESC) ;
CREATE INDEX CONCURRENTLY IF NOT EXISTS perf_exame_piscina ON public.exames_medicos (associado_id,data_validade DESC) WHERE dependente_id IS NULL AND tipo_exame='piscina' AND resultado='apto';
CREATE INDEX CONCURRENTLY IF NOT EXISTS perf_assinatura_ativa ON public.assinaturas_academia (associado_id,data_fim DESC) WHERE status='ativa';
CREATE INDEX CONCURRENTLY IF NOT EXISTS perf_mensalidade_assinatura ON public.mensalidades (assinatura_academia_id,status,data_vencimento) ;
CREATE INDEX CONCURRENTLY IF NOT EXISTS perf_convite_entradas ON public.convite_eventos (criado_em) WHERE acao IN ('clube_entrada','piscina_entrada');
CREATE INDEX CONCURRENTLY IF NOT EXISTS perf_mensagens_hora ON public.mensagens_whatsapp (created_at) ;
CREATE INDEX CONCURRENTLY IF NOT EXISTS perf_contatos_pendentes ON public.conversas_whatsapp (id) WHERE foto_perfil_url IS NULL OR nome_contato IS NULL OR nome_contato='Desconhecido';
ANALYZE public.acessos_academia;
ANALYZE public.acessos_piscina;
ANALYZE public.assinaturas_academia;
ANALYZE public.conversas_whatsapp;
ANALYZE public.convite_eventos;
ANALYZE public.exames_medicos;
ANALYZE public.mensagens_whatsapp;
ANALYZE public.mensalidades;
