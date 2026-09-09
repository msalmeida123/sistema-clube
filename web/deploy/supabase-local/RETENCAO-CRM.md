# Retenção do CRM

Atualize a stack sistema_clube no Portainer com `web-redis.portainer.retencao.yml`, sem baixar imagens novamente. A migração `crm-retencao.sql` já foi aplicada no Supabase local. Em outro ambiente, aplique-a antes de iniciar a stack.

Imagens locais: `sistema-clube:local-retencao-crm-20260908` e `sistema-clube:worker-retencao-20260908`. A stack mantém o proxy da porta 3000 e acrescenta `crm-retencao`, separado do worker de envio. A rotina executa ao iniciar e a cada 24 horas; uma falha é registrada nos logs e a próxima tentativa ocorre no ciclo seguinte.

## Política

- O CRM busca as 50 mensagens mais recentes. O botão de histórico busca mais 50 por vez, usando data e ID como cursor. A consulta periódica é limitada a 50 registros.
- Mensagens com mais de 90 dias, em estado concluído, são arquivadas em lotes de 100 no bucket privado `crm-arquivo`, no formato JSON gzip. O processo lê novamente o arquivo e compara SHA-256 antes da exclusão.
- O banco revalida e bloqueia cada registro na confirmação. Mensagens alteradas após a cópia não são removidas.
- Mensagens recentes, pendentes, falhas e envios incertos são preservados. Registros da fila vinculados são removidos apenas quando enviados e sem atualização há mais de 90 dias; são incluídos no mesmo arquivo.
- A opção **Preservar histórico além de 90 dias**, no cabeçalho da conversa, impede o arquivamento automático daquela conversa. Ela não restaura mensagens já arquivadas.
- O limite é de 10 mil mensagens por execução. Um passivo maior é processado nos dias seguintes.
- Redis elimina trabalhos concluídos/falhos após sete dias e limita a retenção a mil por categoria nos novos trabalhos. A rotina diária também limpa trabalhos antigos. Pendências continuam na fila.
- IDs das mensagens recebidas permanecem em uma tabela pequena, sem conteúdo, para impedir reentregas mesmo após o arquivamento. Mensagens sem ID do provedor não podem ser deduplicadas com segurança.

## Arquivos e recuperação

No Supabase Studio, abra Storage > crm-arquivo. Os arquivos são organizados por data UTC. O arquivo contém `registros`, cada um com `mensagem` e `fila`. Baixe e descompacte para consultar. O CRM mostra somente o histórico ainda no banco; não existe importação automática desses arquivos nesta versão.

Faça backup do volume do Storage juntamente com o banco. O arquivo compactado sai das tabelas de mensagens, mas continua ocupando espaço em disco. Não apague o bucket nem o volume para liberar espaço sem uma cópia externa verificada.

O arquivo inclui referências de mídia, não cópias dos arquivos de imagem/áudio/vídeo. Anexos existentes são preservados; URLs externas continuam sujeitas ao prazo do provedor. Não há limpeza automática de anexos nesta atualização.

## Verificações

`crm-retencao-test.sql` testa idade, preservação, alteração após cópia, reentrega e restrição de acesso em transação com rollback. `crm-retencao.test.ts` verifica que falhas de upload, leitura ou hash impedem a confirmação. `test-crm-archive-storage.cjs` verifica o Storage real com arquivo fictício e o remove ao final.

O ciclo real em `test-crm-retention-cycle.ts` passou: arquivamento, hash, exclusão e recuperação do conteúdo gzip. A paginação foi verificada com 55 mensagens com a mesma data, sem perdas ou duplicatas. Todos os registros e arquivos temporários foram removidos. O primeiro teste do Storage teve timeout durante a construção das imagens; a repetição e o ciclo completo passaram.

Para pausar a limpeza, pare apenas o serviço `crm-retencao` no Portainer. O worker de envio e o CRM continuam funcionando. Nenhuma mensagem real existia no banco ao aplicar a migração.
