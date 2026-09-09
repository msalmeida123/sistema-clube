# Kanban de Serviços

Atualize a stack sistema_clube pelo Editor do Portainer usando `web-redis.portainer.servicos.yml`, sem baixar imagens novamente. A imagem local é `sistema-clube:local-servicos-20260908`. Redis, retenção do CRM, proxy e configuração de Dashboard são mantidos.

A migração `servicos.sql` já foi aplicada no banco local. Em outra instalação, aplique-a antes de atualizar a imagem. Cada empresa mantém sua própria instalação, como definido para o sistema.

## Uso

- No menu, abra **Serviços**. O Kanban de conversas existente permanece como **Kanban CRM**.
- A visão inicial é **Semana**, com colunas de segunda-feira a domingo. Em telas menores, deslize o quadro horizontalmente.
- Use **+** no dia desejado ou **Novo serviço** para cadastrar título, descrição, dia, responsável e prioridade. As tarefas são cadastradas por dia, sem repetição automática.
- Arrastar um cartão na semana ou no mês muda sua data. O seletor no cartão altera o status entre A fazer, Em andamento e Concluído. No celular, use Editar serviço para mudar a data.
- A visão **Dia** organiza as tarefas daquele dia pelas três colunas de status. A visão **Mês** apresenta os dias em calendário, alinhados de segunda a domingo.
- É possível editar e excluir uma tarefa. A exclusão exige confirmação e não pode ser desfeita.
- O quadro consulta até 100 tarefas por vez e oferece Carregar mais quando necessário. A equipe recebe atualizações ao atualizar o quadro ou pela consulta automática a cada 30 segundos.

## Permissões

Administradores já têm acesso. Para liberar a equipe, marque **Serviços** em Configurações > Usuários (ou no cadastro de Usuários). Um usuário ativo com essa permissão pode consultar e gerenciar as tarefas da equipe desta instalação. Usuários sem o módulo e usuários anônimos são bloqueados pelo banco, inclusive via acesso direto.

O campo Responsável lista somente usuários ativos com acesso a Serviços e administradores. Alterações simultâneas são verificadas pela versão da tarefa: se outra pessoa a modificou, reabra o cartão antes de salvar novamente.

## Validação

Os testes de calendário cobrem segunda a domingo, virada de ano, fevereiro bissexto, data inválida e apresentação sem deslocamento de fuso. `servicos-test.sql` verifica criação, movimento, versão antiga, acesso ao módulo e bloqueio de usuário CRM/anônimo em transação com rollback.

Build concluído e sete testes de calendário passaram. No navegador Chromium da skill browse, foram conferidos cadastro, alteração de status, transferência de terça para quarta por eventos de arrastar/soltar, visões mensal e diária e exclusão com confirmação. A tarefa fictícia foi removida. Para o teste na porta 3033, somente os endereços da API no container descartável foram adaptados; a imagem final mantém localhost:3000.
