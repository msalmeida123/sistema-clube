# Backup e logs nas Configurações

Atualize a stack existente do Sistema Clube no Portainer com `web-redis.portainer.backup-logs.yml`, sem solicitar novo pull das imagens locais. Preserve os volumes. Essa stack contém credenciais locais: não publique seu conteúdo.

Imagens locais: `sistema-clube:local-backup-logs-20260908` e `sistema-clube:backup-20260908`.

A migração `sistema-backup-auditoria.sql` já foi aplicada neste banco local. Em outra instalação, aplique-a antes de usar as abas e ajuste a rede e o volume externo de Storage da stack.

## Uso

Entre como administrador e abra **Configurações → Backup → Gerar backup agora**. Aguarde o estado `concluido` e clique em **Baixar backup**. Só um backup pode ficar pendente ou em execução por vez. As cópias ficam no volume `clube-sistema-backups`; não há exclusão automática nem agendamento nesta versão. Mantenha uma cópia protegida fora deste computador.

O arquivo contém `database.dump` (banco completo, inclusive Auth), `storage.tar` (arquivos do Supabase Storage) e `manifest.json` com hashes. O arquivo contém dados e credenciais do banco e não é criptografado. O download exige administrador e é registrado na auditoria. A aplicação monta o volume somente para leitura.

O banco usa snapshot transacional. Para manter a relação entre banco e arquivos, gere a cópia sem uploads ou exclusões de anexos em andamento. A cópia não inclui imagens Docker, stack, variáveis `.env` externas, arquivos fora do Storage ou dados de aparelhos externos. Guarde esses itens separadamente.

## Logs

**Configurações → Logs do sistema** permite filtrar por usuário, período e tipo, com 50 eventos por página. A auditoria registra inclusões, alterações e exclusões nas tabelas públicas existentes na ativação, os eventos selecionados de autenticação e solicitações/conclusões/downloads de backup. As tabelas internas de backup e auditoria não têm o trigger genérico.

Os registros mostram data, ator, ação, tabela, identificador e nomes dos campos alterados. Não guardam valores anteriores ou posteriores, senhas ou conteúdo das mensagens. Chamadas de integração sem ator são identificadas como Sistema / integração. A navegação é informada pelo navegador, portanto não constitui um registro completo de todas as requisições HTTP.

O histórico começa na ativação: não recupera alterações antigas. Tabelas novas precisam receber o trigger; reaplicar a migração faz isso. Os usuários da aplicação não podem editar ou excluir logs; administradores diretos do banco continuam com seus privilégios. Não há limpeza automática da auditoria nesta versão.

## Validação e recuperação

Foi gerado um backup real local, com verificação do catálogo `pg_restore --list`, leitura do arquivo tar e cálculo SHA-256. Testes transacionais verificaram a atribuição do ator, ausência de valores sensíveis e restrições a usuários não administradores.

A imagem passou pelo build e pela checagem TypeScript. Em contêiner temporário, o acesso anônimo foi bloqueado e o administrador conseguiu listar e baixar o backup; tamanho e SHA-256 do download coincidiram com os registrados no banco. O contêiner de teste foi removido. A stack ativa ainda precisa ser atualizada no Portainer.

Ainda não foi realizado um ensaio completo de restauração. Não restaure sobre a instalação em uso: prepare uma instalação isolada compatível com a mesma versão do Supabase/PostgreSQL e extensões, confira os hashes, restaure o banco com `pg_restore` e os arquivos no volume Storage de teste, e valide login, cadastros e anexos. O dump não inclui papéis globais do cluster; a infraestrutura Supabase deve provisioná-los. A restauração requer planejamento técnico para lidar com objetos existentes e funções gerenciadas do Supabase. A interface não oferece restauração destrutiva.
