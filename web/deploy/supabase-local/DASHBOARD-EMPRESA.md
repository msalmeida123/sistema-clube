# Dashboard da empresa

Cada empresa usa sua própria instalação e banco. A escolha de indicadores nesta atualização vale para todos os usuários da instalação; não cria compartilhamento de banco entre empresas.

No Portainer, abra sistema_clube > Editor e utilize `web-redis.portainer.dashboard.yml`. Atualize sem baixar imagens. A nova imagem é `sistema-clube:local-dashboard-empresa-20260908`; os serviços de Redis, retenção e proxy são mantidos.

A migração `dashboard-config.sql` já foi aplicada no banco local, com todos os indicadores atuais habilitados. Para outra instalação, aplique essa migração antes de atualizar a imagem.

## Configuração

1. Entre como administrador e abra Configurações > Dashboard.
2. Selecione **Somente CRM** ou marque individualmente os indicadores de Clube, Financeiro e CRM.
3. Clique em **Salvar Dashboard da empresa**.
4. Reabra o Dashboard. Outros usuários devem reabrir ou atualizar a página.

Os administradores também respeitam os indicadores desativados para a empresa. Usuários comuns veem apenas a interseção entre os indicadores habilitados e suas permissões de módulos em Configurações > Usuários. Uma seleção vazia mostra uma mensagem de painel sem indicadores.

Esta configuração controla o Dashboard inicial. Não concede nem revoga acesso às páginas dos módulos, nem substitui as políticas de acesso aos dados. Para ocultar menus de um usuário CRM, mantenha as permissões de módulos adequadas no cadastro daquele usuário.

O carregamento espera a configuração e não solicita as métricas desativadas. Falha ao carregar a configuração não libera todos os painéis como alternativa. Somente administradores ativos podem alterar a configuração, com controle no banco via RLS.

Validação: TypeScript, testes de seleção por empresa/permissão e testes de consultas condicionais passaram. O teste SQL confirma leitura por usuário ativo, alteração somente por administrador e bloqueio de acesso anônimo, com rollback das alterações de teste.
