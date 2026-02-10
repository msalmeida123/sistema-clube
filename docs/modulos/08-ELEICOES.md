# 🗳️ Módulo: Eleições

> Votação eletrônica para eleições e assembleias do clube.

## Visão Geral

O módulo de Eleições permite a realização de votações eletrônicas no clube, incluindo eleições de diretoria, assembleias e enquetes. Suporta múltiplas chapas, candidatos e controle de elegibilidade dos votantes.

## Funcionalidades

- Criação e configuração de eleições
- Cadastro de chapas e candidatos
- Votação eletrônica com controle de elegibilidade
- Voto secreto (sem identificação do votante)
- Controle de quórum mínimo
- Apuração em tempo real
- Relatório de resultados
- Período de votação configurável
- Verificação de duplicidade de votos

## Estrutura do Módulo

```
src/modules/eleicoes/
├── types/index.ts                        # Interfaces e tipos
├── repositories/eleicoes.repository.ts   # CRUD no Supabase
├── services/eleicoes.service.ts          # Regras de negócio
├── hooks/useEleicoes.ts                  # Hooks React
└── index.ts                              # Exports públicos
```

## Tipos Principais

```typescript
type StatusEleicao = 'rascunho' | 'aberta' | 'em_votacao' | 'encerrada' | 'cancelada'
type TipoEleicao = 'diretoria' | 'conselho' | 'assembleia' | 'enquete'

interface Eleicao {
  id: string
  titulo: string
  descricao?: string
  tipo: TipoEleicao
  status: StatusEleicao
  data_inicio: string
  data_fim: string
  quorum_minimo?: number
  total_votantes_elegiveis: number
  total_votos: number
  created_at: string
}

interface Chapa {
  id: string
  eleicao_id: string
  nome: string
  numero: number
  descricao?: string
  candidatos: Candidato[]
  votos: number
}

interface Candidato {
  id: string
  chapa_id: string
  nome: string
  cargo: string
  foto_url?: string
  associado_id?: string
}

interface Voto {
  id: string
  eleicao_id: string
  chapa_id: string
  votante_hash: string // Hash do associado (voto secreto)
  data_voto: string
}

interface ResultadoEleicao {
  eleicao: Eleicao
  chapas: (Chapa & { percentual: number })[]
  votos_brancos: number
  votos_nulos: number
  total_votos: number
  quorum_atingido: boolean
}
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useEleicoes()` | Lista eleições |
| `useEleicao(id)` | Detalhes de uma eleição |
| `useEleicoesMutations()` | Criar eleição, votar, encerrar |
| `useResultado(eleicao_id)` | Resultado da eleição |

## Uso

```tsx
import { useEleicoes, useEleicoesMutations } from '@/modules/eleicoes'

export default function EleicoesPage() {
  const { eleicoes, loading } = useEleicoes()
  const { votar } = useEleicoesMutations()

  const handleVotar = async (eleicaoId: string, chapaId: string) => {
    await votar(eleicaoId, chapaId)
  }

  return <EleicoesTable eleicoes={eleicoes} loading={loading} />
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `eleicoes` | Eleições cadastradas |
| `chapas` | Chapas de cada eleição |
| `candidatos` | Candidatos de cada chapa |
| `votos` | Registro de votos (hash, sem identificação) |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Associados** | Elegibilidade de votantes (apenas ativos e adimplentes) |
| **Financeiro** | Inadimplência pode impedir voto |
| **CRM** | Notificação de eleições via WhatsApp |

## Regras de Negócio

1. Apenas associados ativos e adimplentes podem votar
2. Cada associado pode votar uma única vez por eleição
3. Voto é secreto — armazena-se apenas o hash do votante
4. Eleição só é válida se atingir o quórum mínimo
5. Resultado é apurado automaticamente ao encerrar
6. Eleição encerrada não pode ser reaberta
7. Período de votação é respeitado rigorosamente (data início/fim)
