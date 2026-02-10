# 💬 Módulo: CRM

> CRM com integração WhatsApp, gestão de contatos, mensagens e campanhas.

## Visão Geral

O módulo CRM integra o clube com o WhatsApp para comunicação direta com associados e prospects. Permite envio e recebimento de mensagens, respostas automáticas via bot, campanhas em massa e atendimento centralizado.

## Funcionalidades

- Gestão de contatos (vinculados ou não a associados)
- Chat em tempo real via WhatsApp (WaSenderAPI)
- Respostas automáticas por palavras-chave
- Configuração de bot com IA (opcional)
- Campanhas de mensagens em massa
- Horário de atendimento configurável
- Etiquetas e segmentação de contatos
- Dashboard com métricas de atendimento
- Histórico completo de conversas

## Estrutura do Módulo

```
src/modules/crm/
├── types/index.ts                  # Interfaces e tipos
├── repositories/crm.repository.ts  # CRUD no Supabase
├── services/crm.service.ts         # Regras de negócio
├── hooks/useCRM.ts                 # Hooks React
└── index.ts                        # Exports públicos
```

## Tipos Principais

```typescript
type StatusContato = 'novo' | 'em_atendimento' | 'aguardando' | 'finalizado' | 'bloqueado'
type TipoMensagem = 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao'
type StatusMensagem = 'enviada' | 'entregue' | 'lida' | 'erro'

interface Contato {
  id: string
  nome: string
  telefone: string
  email?: string
  associado_id?: string
  associado_nome?: string
  ultimo_contato?: string
  status: StatusContato
  etiquetas?: string[]
  observacoes?: string
  created_at: string
  updated_at?: string
}

interface Mensagem {
  id: string
  contato_id: string
  tipo: TipoMensagem
  conteudo: string
  media_url?: string
  direcao: 'entrada' | 'saida'
  status: StatusMensagem
  enviada_por?: string
  data_envio: string
  data_leitura?: string
  created_at: string
}

interface RespostaAutomatica {
  id: string
  gatilho: string
  tipo_gatilho: 'exato' | 'contem' | 'regex'
  resposta: string
  ativo: boolean
  prioridade: number
}

interface ConfiguracaoBot {
  id: string
  ativo: boolean
  horario_inicio?: string
  horario_fim?: string
  dias_semana?: number[]
  mensagem_fora_horario?: string
  usar_ia: boolean
  prompt_ia?: string
}

interface Campanha {
  id: string
  nome: string
  mensagem: string
  tipo: 'texto' | 'imagem'
  status: 'rascunho' | 'agendada' | 'enviando' | 'concluida' | 'cancelada'
  total_contatos: number
  enviadas: number
  entregues: number
  lidas: number
  erros: number
}

interface CRMStats {
  total_contatos: number
  novos_hoje: number
  em_atendimento: number
  mensagens_hoje: number
  tempo_medio_resposta?: number
}
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useContatos(filters?)` | Lista contatos com filtros |
| `useMensagens(contato_id)` | Mensagens de um contato |
| `useCRMStats()` | Estatísticas do CRM |
| `useCRMMutations()` | Enviar mensagem, criar contato, etc. |

## Uso

```tsx
import { useContatos, useCRMStats } from '@/modules/crm'

export default function CRMPage() {
  const { contatos, loading } = useContatos({ status: 'em_atendimento' })
  const stats = useCRMStats()

  return (
    <>
      <StatsCards stats={stats} />
      <ContatosList contatos={contatos} loading={loading} />
    </>
  )
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `crm_contatos` | Cadastro de contatos |
| `crm_mensagens` | Histórico de mensagens |
| `crm_respostas_automaticas` | Respostas do bot |
| `crm_configuracao_bot` | Configurações do bot |
| `crm_campanhas` | Campanhas de mensagens |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Associados** | Contatos podem ser vinculados a associados |
| **Financeiro** | Envio de cobranças via WhatsApp |
| **n8n** | Automações de envio e recebimento |

## Integrações Externas

| Serviço | Função |
|---------|--------|
| **WaSenderAPI** | Envio/recebimento de mensagens WhatsApp |
| **n8n** | Orquestração de automações e webhooks |

## Regras de Negócio

1. Mensagens recebidas são processadas pelo bot se ativo
2. Bot respeita horário de atendimento configurado
3. Respostas automáticas têm prioridade (menor número = maior prioridade)
4. Campanhas respeitam limite de envio por hora
5. Contatos bloqueados não recebem mensagens
6. Histórico de mensagens é mantido indefinidamente
7. Webhook do WaSenderAPI envia mensagens recebidas para n8n
