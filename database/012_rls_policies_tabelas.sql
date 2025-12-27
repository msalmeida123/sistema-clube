-- =====================================================
-- POLÍTICAS RLS POR TABELA
-- =====================================================

-- ASSOCIADOS --
-- Admin, Presidente, Vice, Secretaria podem ver/editar todos
CREATE POLICY "associados_select_admin" ON associados FOR SELECT
  USING (is_admin_or_diretoria() OR is_secretaria());

CREATE POLICY "associados_insert_secretaria" ON associados FOR INSERT
  WITH CHECK (is_secretaria() OR is_admin_or_diretoria());

CREATE POLICY "associados_update_secretaria" ON associados FOR UPDATE
  USING (is_secretaria() OR is_admin_or_diretoria());

-- Portaria pode ver dados básicos para consulta
CREATE POLICY "associados_select_portaria" ON associados FOR SELECT
  USING (is_portaria());

-- Associado pode ver seus próprios dados
CREATE POLICY "associados_select_proprio" ON associados FOR SELECT
  USING (
    id = (SELECT associado_id FROM usuarios WHERE id = auth.uid())
  );

-- DEPENDENTES --
CREATE POLICY "dependentes_all_secretaria" ON dependentes FOR ALL
  USING (is_secretaria() OR is_admin_or_diretoria());

CREATE POLICY "dependentes_select_portaria" ON dependentes FOR SELECT
  USING (is_portaria());

-- DOCUMENTOS --
CREATE POLICY "documentos_all_secretaria" ON documentos FOR ALL
  USING (is_secretaria() OR is_admin_or_diretoria());

-- EXAMES MÉDICOS --
CREATE POLICY "exames_all_secretaria" ON exames_medicos FOR ALL
  USING (is_secretaria() OR is_admin_or_diretoria());

CREATE POLICY "exames_select_portaria_piscina" ON exames_medicos FOR SELECT
  USING (get_user_tipo() IN ('portaria_piscina', 'admin', 'presidente', 'vice_presidente'));

-- =====================================================
-- FINANCEIRO (só financeiro e diretoria veem)
-- =====================================================

CREATE POLICY "mensalidades_all_financeiro" ON mensalidades FOR ALL
  USING (is_financeiro());

CREATE POLICY "pagamentos_all_financeiro" ON pagamentos FOR ALL
  USING (is_financeiro());

CREATE POLICY "fornecedores_all_financeiro" ON fornecedores FOR ALL
  USING (is_financeiro());

CREATE POLICY "contas_pagar_all_financeiro" ON contas_pagar FOR ALL
  USING (is_financeiro());

CREATE POLICY "contas_receber_all_financeiro" ON contas_receber FOR ALL
  USING (is_financeiro());

CREATE POLICY "movimentacoes_all_financeiro" ON movimentacoes FOR ALL
  USING (is_financeiro());

CREATE POLICY "solicitacoes_compra_all_financeiro" ON solicitacoes_compra FOR ALL
  USING (is_financeiro());

CREATE POLICY "cotacoes_all_financeiro" ON cotacoes FOR ALL
  USING (is_financeiro());

CREATE POLICY "ordens_compra_all_financeiro" ON ordens_compra FOR ALL
  USING (is_financeiro());

-- =====================================================
-- REGISTROS DE ENTRADA
-- =====================================================

CREATE POLICY "entradas_insert_portaria" ON registros_entrada FOR INSERT
  WITH CHECK (is_portaria());

CREATE POLICY "entradas_select_portaria" ON registros_entrada FOR SELECT
  USING (is_portaria() OR is_admin_or_diretoria());

-- =====================================================
-- WHATSAPP CRM
-- =====================================================

CREATE POLICY "whatsapp_all_atendimento" ON whatsapp_conversas FOR ALL
  USING (is_atendimento() OR is_admin_or_diretoria());

CREATE POLICY "whatsapp_msg_all_atendimento" ON whatsapp_mensagens FOR ALL
  USING (is_atendimento() OR is_admin_or_diretoria());

-- =====================================================
-- ELEIÇÕES E DIRETORIA
-- =====================================================

CREATE POLICY "eleicoes_select_all" ON eleicoes FOR SELECT
  USING (true); -- todos podem ver eleições

CREATE POLICY "eleicoes_manage_admin" ON eleicoes FOR ALL
  USING (is_admin_or_diretoria());

CREATE POLICY "diretoria_select_all" ON diretoria FOR SELECT
  USING (true); -- todos podem ver diretoria

CREATE POLICY "diretoria_manage_admin" ON diretoria FOR ALL
  USING (get_user_tipo() = 'admin');

-- =====================================================
-- LOGS (só admin)
-- =====================================================

CREATE POLICY "logs_all_admin" ON logs_acesso FOR ALL
  USING (get_user_tipo() = 'admin');

