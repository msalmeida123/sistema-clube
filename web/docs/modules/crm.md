# Módulo: CRM / WhatsApp

CRM de atendimento via WhatsApp integrado ao clube: contatos, mensagens, respostas automáticas, bot com IA e campanhas.

## Localização
`src/modules/crm/`

## Status
⚠️ Sem UI própria (types/repository/service/hooks; a UI vive nas páginas em `src/app/`)

> ℹ️ Este módulo do monólito coexiste com o **microserviço `crm-service`** (repo `sistema-clube-microservices`), que expõe as rotas `/api/crm/*` e `/api/wasender/*` via Traefik em `clube.mindforge.dev.br`, comunicando com WaSender para envio/recebimento real de mensagens.

## Entidades principais
### `Contato`
nome, telefone, email, associado_id/nome (vínculo opcional com sócio), `status` (`novo | em_atendimento | aguardando | finalizado`), etiquetas, último contato.

### `Mensagem`
contato_id, `tipo` (`texto | imagem | documento | audio | video`), conteúdo, media_url, `direcao` (`entrada | saida`), `status` (`pendente | enviada | entregue | lida | erro`).

### `RespostaAutomatica`
gatilho (palavra-chave/regex), `tipo_gatilho` (`exato | contem | regex`), resposta, prioridade, ativo.

### `ConfiguracaoBot`
ativo, horário de funcionamento, dias da semana, mensagem fora de horário, `usar_ia` + `prompt_ia` (integração OpenAI).

### `Campanha`
disparo em massa: mensagem, tipo, agendamento, contadores (enviadas/entregues/lidas/erros).

Outros tipos: `ContatoFilters`, `MensagemFilters`, `ContatoFormData`, `CRMStats` (total_contatos, novos_hoje, em_atendimento, mensagens_hoje, tempo_medio_resposta).

## Hooks
- `useContatos`, `useConversa`, `useContatosMutations`
- `useRespostasAutomaticas`
- `useConfiguracaoBot`
- `useCRMStats`
- `useWhatsAppNotifications`

## Repository / Service
- `CRMRepository` / `createCRMRepository`
- `CRMService` / `createCRMService`
- Repositories específicos: `contatos.repository.ts`, `crm.repository.ts`

## Uso
```tsx
import { useContatos, useCRMStats } from '@/modules/crm'
```

## Relacionados
- `associados` (contato pode estar vinculado a um sócio)
- microserviço `crm-service` (WaSender Factory Pattern: WaSender primário + Meta Cloud API fallback; roteamento Kanban por setor; RAG/Qdrant para o bot)
