# Configuração da API oficial

Em Configurações, a aba WhatsApp Oficial (Meta) fica ao lado de WaSenderAPI.

Nessa aba é possível cadastrar/editar conexões Meta, preencher Phone Number ID, WABA ID, Access Token, App ID, App Secret e Verify Token, definir a conexão padrão e testar a conexão. O formulário é compartilhado com /dashboard/whatsapp-providers; os dados continuam na tabela whatsapp_providers.

O teste de conexão agora carrega as credenciais salvas no servidor, respeitando o acesso do usuário à configuração. Não usa o token mascarado do formulário.

Validação: TypeScript e dois testes do endpoint de teste de conexão passaram. Não foram cadastradas credenciais nem feitas chamadas reais à Meta.

Imagem: sistema-clube:local-config-meta-20260907. Build concluído com sucesso. Para ativar, atualizar somente a imagem do serviço sistema-clube no Portainer, mantendo Redis e worker da stack já configurada, sem Pull image. Recarregar o navegador com Ctrl+F5 e abrir Configurações > WhatsApp Oficial (Meta).
