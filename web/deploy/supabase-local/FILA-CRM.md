# Fila Redis do CRM

Stack: web-redis.portainer.yml. Substitua o conteúdo da stack existente sistema_clube por este arquivo e escolha Update stack sem Pull image. Não crie uma segunda stack com a mesma porta 3000.

Imagens locais:
- sistema-clube:local-fila-crm-20260907
- sistema-clube:worker-crm-20260907
- redis:7.4-alpine

As migrações crm-fila.sql e crm-fila-automatico.sql já foram aplicadas no Supabase local. Em outra instalação, aplicar depois de crm-whatsapp.sql. As credenciais da stack são locais e não devem ser versionadas nem compartilhadas.

Funcionamento: os textos e anexos enviados pela tela CRM são gravados atomicamente no histórico e na caixa de saída do Postgres. A API responde 202. O worker publica as pendências no Redis/BullMQ, que guarda apenas o identificador da tarefa. A API não abre conexão com o Redis. O worker consulta destinatário, permissões e provedor no banco antes do envio. A fila fica limitada a 5.000 pendências. Redis indisponível não perde mensagens já aceitas: o worker recupera pendências do banco a cada 5 segundos.

Ritmo: uma tarefa global por vez, inclusive com mais de um worker. CRM_SEND_INTERVAL_MS controla o intervalo mínimo (padrão 3000; mínimo 1000). O Redis não expõe portas, usa AOF e política noeviction. O ritmo deve respeitar o limite contratado do provedor; a fila não garante que o WhatsApp nunca limitará uma conta.

A tela mostra Na fila, Enviando, Enviada, Falhou ou Conferir envio. Atualiza o histórico a cada 5 segundos, independentemente de WebSocket. Uma resposta ambígua, timeout ou interrupção após início do envio não provoca reenvio automático. Confira no provedor antes de reenviar manualmente. Não há promessa de entrega exatamente uma vez por parte da API externa.

Configurar o número/provedor no cadastro WhatsApp Providers antes de enviar. A estrutura de provedores foi criada com acesso administrativo; nenhuma credencial de WhatsApp foi inventada ou ativada.

Escopo: textos e anexos da tela CRM, respostas automáticas e IA dos webhooks WaSender/Meta. O endpoint legado /api/wasender/send passa pela mesma autorização/fila e agora exige conversaId e requestId. O worker é o único processo que efetua os envios. Novas integrações devem usar a fila, não chamar os adaptadores diretamente. Não foram testados envios reais.

Testes: scripts/test-crm-redis.cjs usa remetente simulado e Redis temporário em 127.0.0.1:16379. Verifica deduplicação, sequência, limite global e intervalo com dois workers. crm-fila-test.sql verifica atomicidade, repetição de identificador e bloqueio de acesso, com ROLLBACK de todos os dados.

Validação adicional: 59 testes unitários de rota/factory/adaptadores passaram. O worker Docker foi testado recuperando pendência do banco, bloqueando provedor inativo e reconciliando tarefa interrompida, sem envio externo.
Validação final da imagem web: visitante bloqueado pelo middleware; administrador autenticado; duas requisições concorrentes do mesmo identificador retornaram 202 e produziram apenas uma pendência e uma mensagem no histórico, com Redis desligado. Container e registros temporários removidos após o teste. As duas imagens Docker foram construídas com sucesso. A stack ainda precisa ser atualizada no Portainer para ativar Redis e worker permanentes.
