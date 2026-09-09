# CRM no Supabase local

Aplique crm-whatsapp.sql no banco postgres local com ON_ERROR_STOP=1. A migração é transacional e pode ser reaplicada. Foi aplicada e reaplicada com sucesso em 07/09/2026.

Cria setores, usuarios_setores, conversas_whatsapp, mensagens_whatsapp, templates_mensagens e transferencias_whatsapp. A view setores_whatsapp usa security_invoker e compartilha os registros com o cadastro de Setores. Não altera as tabelas antigas whatsapp_mensagens e whatsapp_templates (vazias na verificação).

Admin ativo tem acesso total. Os demais usuários ativos ficam restritos aos setores vinculados; conversas sem setor ficam disponíveis para quem tem algum vínculo. Anônimos não têm acesso. Configure setores e vínculos pelo menu Setores; não foram inseridos contatos ou mensagens reais.

Validação: consultas REST pelo proxy real retornaram HTTP 200 para admin e 401 para anônimo nas cinco tabelas consultadas pelo CRM. crm-whatsapp-test.sql verifica isolamento entre dois setores, bloqueio de inserção em conversa alheia e bloqueio de usuário inativo. Todos os dados desse teste são revertidos. A tela CRM abriu no gstack após a migração.

Código: useSetoresUsuario passa pelo helper de auth_id e verifica ativo/erros. usePermissoes adia consultas disparadas por onAuthStateChange para depois da liberação do lock de sessão. TypeScript passou. O erro específico de Navigator LockManager no Firefox não foi reproduzido nem considerado resolvido apenas por esse ajuste.

Limitações: o proxy local ainda apresenta falha de WebSocket do Realtime. A correção das tabelas não corrige esse transporte; use Atualizar para recarregar conversas. Envio de WhatsApp e integrações externas não foram testados. A criação das tabelas do CRM não representa a migração de todos os módulos auxiliares ou das views de relatórios.

Imagem preparada: sistema-clube:local-crm-20260907. Atualizar no Portainer sem puxar a imagem do registry (build concluído com sucesso). A migração de banco já está ativa; as alterações dos hooks dependem de atualizar o container.
