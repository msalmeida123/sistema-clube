# ⚠️ Módulo: Infrações

> Registro e gestão de infrações disciplinares de associados e dependentes.

## Visão Geral

O módulo de Infrações gerencia o registro de ocorrências disciplinares no clube, aplicação de penalidades, suspensões e acompanhamento de processos disciplinares. É fundamental para manter a ordem e o cumprimento do regimento interno.

## Funcionalidades

- Registro de infrações com classificação de gravidade
- Tipos de infração configuráveis
- Aplicação de penalidades (advertência, suspensão, exclusão)
- Controle de período de suspensão
- Workflow de processo disciplinar
- Histórico completo por associado/dependente
- Relatórios de infrações
- Integração com portaria para bloqueio de acesso

## Estrutura do Módulo

```
src/modules/infracoes/
├── types/index.ts                          # Interfaces e tipos
├── repositories/infracoes.repository.ts    # CRUD no Supabase
├── services/infracoes.service.ts           # Regras de negócio
├── hooks/useInfracoes.ts                   # Hooks React
└── index.ts                                # Exports públicos
```

## Tipos Principais

```typescript
type GravidadeInfracao = 'leve' | 'media' | 'grave' | 'gravissima'
type StatusInfracao = 'registrada' | 'em_analise' | 'julgada' | 'arquivada' | 'recorrida'
type TipoPenalidade = 'advertencia_verbal' | 'advertencia_escrita' | 'suspensao' | 'exclusao'

interface Infracao {
  id: string
  pessoa_id: string
  pessoa_nome?: string
  tipo_pessoa: 'associado' | 'dependente'
  tipo_infracao: string
  descricao: string
  gravidade: GravidadeInfracao
  data_ocorrencia: string
  local_ocorrencia?: string
  testemunhas?: string
  evidencias_url?: string[]
  status: StatusInfracao
  penalidade?: TipoPenalidade
  data_inicio_suspensao?: string
  data_fim_suspensao?: string
  registrado_por: string
  registrado_por_nome?: string
  parecer?: string
  observacoes?: string
  created_at: string
  updated_at?: string
}

interface InfracaoFilters {
  tipo_pessoa?: 'associado' | 'dependente'
  gravidade?: GravidadeInfracao
  status?: StatusInfracao
  pessoa_id?: string
  data_inicio?: string
  data_fim?: string
}

interface InfracoesStats {
  total_registradas: number
  em_analise: number
  suspensoes_ativas: number
  infrações_mes: number
}
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useInfracoes(filters?)` | Lista infrações com filtros |
| `useInfracao(id)` | Detalhes de uma infração |
| `useInfracoesMutations()` | Registrar, julgar, aplicar penalidade |
| `useInfracoesStats()` | Estatísticas de infrações |

## Uso

```tsx
import { useInfracoes, useInfracoesMutations } from '@/modules/infracoes'

export default function InfracoesPage() {
  const { infracoes, loading } = useInfracoes({ status: 'em_analise' })
  const { registrarInfracao, aplicarPenalidade } = useInfracoesMutations()

  return <InfracoesTable infracoes={infracoes} loading={loading} />
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `infracoes` | Registros de infrações |
| `tipos_infracao` | Tipos configuráveis de infrações |
| `penalidades` | Penalidades aplicadas |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Associados** | Infrações vinculadas ao associado |
| **Dependentes** | Infrações vinculadas ao dependente |
| **Portaria** | Suspensão bloqueia acesso |
| **Auth** | Apenas usuários autorizados podem julgar |
| **CRM** | Notificação de penalidade via WhatsApp |

## Regras de Negócio

1. Infrações graves podem resultar em suspensão imediata
2. Acúmulo de advertências pode gerar suspensão automática (configurável)
3. Suspensão bloqueia acesso na portaria durante o período
4. Exclusão requer aprovação da diretoria
5. Evidências são armazenadas no Supabase Storage
6. Infração de dependente pode ser vinculada ao titular
7. Processo disciplinar segue workflow: registrada → em análise → julgada
8. Associado pode recorrer de penalidades dentro do prazo
