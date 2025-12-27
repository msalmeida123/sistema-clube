-- =============================================
-- POLICIES POR SETOR
-- =============================================

-- ADMIN pode tudo
CREATE POLICY admin_all ON usuarios FOR ALL USING (get_user_setor() = 'admin');
CREATE POLICY admin_all_associados ON associados FOR ALL USING (get_user_setor() = 'admin');
CREATE POLICY admin_all_mensalidades ON mensalidades FOR ALL USING (get_user_setor() = 'admin');

-- CLUBE CONFIG - Somente Admin
CREATE POLICY clube_config_admin ON clube_config FOR ALL USING (get_user_setor() = 'admin');
CREATE POLICY clube_config_read ON clube_config FOR SELECT USING (true);

-- ASSOCIADOS - Secretaria + Admin + Diretoria
CREATE POLICY associados_secretaria_select ON associados FOR SELECT USING (is_secretaria() OR is_portaria());
CREATE POLICY associados_secretaria_insert ON associados FOR INSERT WITH CHECK (is_secretaria());
CREATE POLICY associados_secretaria_update ON associados FOR UPDATE USING (is_secretaria());
CREATE POLICY associados_secretaria_delete ON associados FOR DELETE USING (is_admin_or_diretoria());

-- DEPENDENTES - Secretaria
CREATE POLICY dependentes_secretaria ON dependentes FOR ALL USING (is_secretaria());
CREATE POLICY dependentes_portaria_read ON dependentes FOR SELECT USING (is_portaria());

-- AGREGADOS - Secretaria
CREATE POLICY agregados_secretaria ON agregados FOR ALL USING (is_secretaria());
CREATE POLICY agregados_portaria_read ON agregados FOR SELECT USING (is_portaria());

-- DOCUMENTOS - Secretaria
CREATE POLICY documentos_secretaria ON documentos FOR ALL USING (is_secretaria());

-- EXAMES MÉDICOS - Secretaria + Portaria Piscina (leitura)
CREATE POLICY exames_secretaria ON exames_medicos FOR ALL USING (is_secretaria());
CREATE POLICY exames_portaria_read ON exames_medicos FOR SELECT 
    USING (get_user_setor() IN ('portaria_piscina', 'admin', 'presidente', 'vice_presidente'));

-- =============================================
-- FINANCEIRO - Somente setor Financeiro
-- =============================================

CREATE POLICY mensalidades_financeiro ON mensalidades FOR ALL USING (is_financeiro());
CREATE POLICY boletos_financeiro ON boletos FOR ALL USING (is_financeiro());
CREATE POLICY pix_financeiro ON pix_cobrancas FOR ALL USING (is_financeiro());
CREATE POLICY fornecedores_financeiro ON fornecedores FOR ALL USING (is_financeiro());
CREATE POLICY solicitacoes_financeiro ON solicitacoes_compra FOR ALL USING (is_financeiro());
CREATE POLICY cotacoes_financeiro ON cotacoes FOR ALL USING (is_financeiro());
CREATE POLICY ordens_financeiro ON ordens_compra FOR ALL USING (is_financeiro());
CREATE POLICY contas_pagar_financeiro ON contas_pagar FOR ALL USING (is_financeiro());
CREATE POLICY contas_bancarias_financeiro ON contas_bancarias FOR ALL USING (is_financeiro());
CREATE POLICY movimentacoes_financeiro ON movimentacoes FOR ALL USING (is_financeiro());

-- =============================================
-- CONTROLE DE ACESSO FÍSICO - Portarias
-- =============================================

CREATE POLICY pontos_acesso_read ON pontos_acesso FOR SELECT USING (is_portaria());
CREATE POLICY pontos_acesso_admin ON pontos_acesso FOR ALL USING (is_admin_or_diretoria());

CREATE POLICY registros_acesso_portaria ON registros_acesso FOR ALL USING (is_portaria());
CREATE POLICY registros_acesso_read ON registros_acesso FOR SELECT USING (is_admin_or_diretoria());

-- CARTEIRINHAS
CREATE POLICY carteirinhas_secretaria ON carteirinhas FOR ALL USING (is_secretaria());
CREATE POLICY carteirinhas_portaria_read ON carteirinhas FOR SELECT USING (is_portaria());

-- =============================================
-- DIRETORIA E ELEIÇÕES
-- =============================================

CREATE POLICY diretoria_admin ON diretoria FOR ALL USING (is_admin_or_diretoria());
CREATE POLICY diretoria_read ON diretoria FOR SELECT USING (true);

CREATE POLICY eleicoes_admin ON eleicoes FOR ALL USING (is_admin_or_diretoria());
CREATE POLICY eleicoes_read ON eleicoes FOR SELECT USING (true);

CREATE POLICY chapas_admin ON chapas FOR ALL USING (is_admin_or_diretoria());
CREATE POLICY chapas_read ON chapas FOR SELECT USING (true);

CREATE POLICY candidatos_admin ON candidatos FOR ALL USING (is_admin_or_diretoria());
CREATE POLICY candidatos_read ON candidatos FOR SELECT USING (true);

-- Votos são secretos - só admin pode ver estatísticas
CREATE POLICY votos_admin ON votos FOR SELECT USING (get_user_setor() = 'admin');
CREATE POLICY votos_insert ON votos FOR INSERT WITH CHECK (true);

-- =============================================
-- CONVITES
-- =============================================

CREATE POLICY convites_admin ON convites FOR ALL USING (is_admin_or_diretoria());
CREATE POLICY convites_secretaria ON convites FOR ALL USING (is_secretaria());
CREATE POLICY convites_portaria_read ON convites FOR SELECT USING (is_portaria());

-- =============================================
-- RECLAMAÇÕES E PUNIÇÕES
-- =============================================

CREATE POLICY reclamacoes_secretaria ON reclamacoes FOR ALL USING (is_secretaria() OR is_admin_or_diretoria());
CREATE POLICY punicoes_diretoria ON punicoes FOR ALL USING (is_admin_or_diretoria());

-- =============================================
-- CRM WHATSAPP - Atendimento
-- =============================================

CREATE POLICY conversas_atendimento ON conversas_whatsapp FOR ALL USING (is_atendimento());
CREATE POLICY mensagens_atendimento ON mensagens_whatsapp FOR ALL USING (is_atendimento());

-- =============================================
-- ACADEMIA
-- =============================================

CREATE POLICY inscricoes_academia_secretaria ON inscricoes_academia FOR ALL USING (is_secretaria());
CREATE POLICY inscricoes_academia_portaria_read ON inscricoes_academia FOR SELECT 
    USING (get_user_setor() IN ('portaria_academia', 'admin', 'presidente', 'vice_presidente'));

-- =============================================
-- LOGS - Somente Admin
-- =============================================

CREATE POLICY logs_admin ON logs_sistema FOR ALL USING (get_user_setor() = 'admin');

