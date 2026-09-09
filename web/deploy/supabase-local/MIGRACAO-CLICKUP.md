# Migração do ClickUp para Supabase local

Aplicada em 07/09/2026 ao container clube-supabase-db, banco postgres.

## Fontes
- schema-clickup-original.sql: https://app.clickup.com/t/868hkc6f7 (38 tabelas).
- ../../src/modules/rh/sql/create_tables.sql (4 tabelas).
- before-schema.sql e before-columns.json: estrutura local anterior.

## Resultado
- 25 tabelas novas, 52 colunas acrescentadas; total local: 56 tabelas.
- As 42 tabelas das fontes estão presentes, considerando os nomes adaptados.
- bar_carteirinha_saldos foi adaptada para carteirinha_saldo; bar_carteirinha_movimentos para carteirinha_movimentos, conforme o repositório do módulo Bar.
- Colunas e restrições existentes foram preservadas, incluindo usuarios.auth_id e sua referência a auth.users.
- As tabelas novas têm RLS: somente administrador ativo pode acessar pelo papel authenticated. O papel anon não recebeu acesso. Mantido o papel service_role para operações administrativas do servidor.
- O SQL permissivo de RH que dava acesso total a qualquer autenticado não foi importado.
- Nenhum registro de negócio foi importado do ClickUp; a fonte contém estrutura SQL.

## Validação
1. Execução completa com ROLLBACK passou.
2. Duas execuções na mesma transação passaram (reaplicação).
3. Administrador ativo conseguiu inserir e consultar; administrador inativo e anon foram bloqueados. Os registros de teste foram revertidos.
4. Após COMMIT, checksums de todos os campos e registros anteriores permaneceram iguais.

## Arquivos
- migracao-clickup-local.sql: migração aplicada, com transação e controle de concorrência.
- migration-inventory.json: tabelas e colunas acrescentadas e campos preservados.
- backups/clube-pre-clickup.dump: backup completo anterior, formato pg_dump custom, ignorado pelo Git.
- testar-migracao.cjs: validação transacional, exige Docker local e a estrutura desta instalação.

## Limites
Esta é uma adaptação aditiva para este banco local, não um instalador para banco vazio. Os tipos, defaults e restrições antigos não foram substituídos pelos do ClickUp: por exemplo, associados.numero_titulo permanece texto. Não foram inventados dados para preencher novos campos nem sincronizadas tabelas legadas do WhatsApp com as novas tabelas do ClickUp.

A conexão da aplicação, criação do usuário de login, views/RPCs não presentes nessas fontes e testes completos de cada tela são etapas separadas. Não há garantia de compatibilidade de todos os formulários apenas pela presença das tabelas. Permissões de usuários que não são administradores precisam de regras específicas antes de liberar esses perfis.

Não execute schema-clickup-original.sql sobre o banco existente. Para esta instalação, utilize a migração adaptada. O backup inclui dados sensíveis e deve permanecer local.
