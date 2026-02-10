# ⚙️ Módulo: Configurações

> Configurações gerais do sistema, planos, quiosques e parâmetros do clube.

## Visão Geral

O módulo de Configurações centraliza todos os parâmetros do sistema, incluindo dados do clube, planos de associação, quiosques, categorias, tipos configuráveis e preferências gerais. É o módulo que alimenta as regras de negócio de todos os outros módulos.

## Funcionalidades

- Dados gerais do clube (nome, CNPJ, endereço, logo)
- Gestão de planos de associação e valores
- Cadastro de quiosques e espaços
- Configuração de tipos de exame
- Configuração de tipos de infração e penalidades
- Parâmetros financeiros (juros, multa, dia de vencimento)
- Configuração de horários de funcionamento
- Gestão de páginas e permissões do sistema
- Personalização visual (tema, cores)

## Estrutura do Módulo

```
src/modules/configuracoes/
├── types/index.ts                              # Interfaces e tipos
├── repositories/configuracoes.repository.ts    # CRUD no Supabase
├── services/configuracoes.service.ts           # Regras de negócio
├── hooks/useConfiguracoes.ts                   # Hooks React
└── index.ts                                    # Exports públicos
```

## Tipos Principais

```typescript
interface ConfiguracaoClube {
  id: string
  nome_clube: string
  cnpj?: string
  endereco?: string
  telefone?: string
  email?: string
  logo_url?: string
  horario_funcionamento?: HorarioFuncionamento
  parametros_financeiros: ParametrosFinanceiros
  created_at: string
  updated_at?: string
}

interface Plano {
  id: string
  nome: string
  descricao?: string
  valor_mensal: number
  valor_anual?: number
  max_dependentes?: number
  beneficios?: string[]
  ativo: boolean
  created_at: string
}

interface Quiosque {
  id: string
  nome: string
  descricao?: string
  capacidade?: number
  valor_diaria?: number
  valor_mensal?: number
  disponivel: boolean
  foto_url?: string
  created_at: string
}

interface ParametrosFinanceiros {
  dia_vencimento: number
  taxa_juros_mensal: number
  taxa_multa: number
  meses_inadimplencia_suspensao: number
  desconto_antecipacao?: number
}

interface HorarioFuncionamento {
  segunda: { abertura: string; fechamento: string } | null
  terca: { abertura: string; fechamento: string } | null
  quarta: { abertura: string; fechamento: string } | null
  quinta: { abertura: string; fechamento: string } | null
  sexta: { abertura: string; fechamento: string } | null
  sabado: { abertura: string; fechamento: string } | null
  domingo: { abertura: string; fechamento: string } | null
}
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useConfiguracao()` | Configurações gerais do clube |
| `usePlanos()` | Lista planos de associação |
| `useQuiosques()` | Lista quiosques/espaços |
| `useConfiguracoesMutations()` | Atualizar configs, planos, etc. |

## Uso

```tsx
import { useConfiguracao, usePlanos, useQuiosques } from '@/modules/configuracoes'

export default function ConfiguracoesPage() {
  const { config, loading } = useConfiguracao()
  const { planos } = usePlanos()
  const { quiosques } = useQuiosques()

  return (
    <Tabs>
      <Tab label="Geral"><ConfigGeralForm config={config} /></Tab>
      <Tab label="Planos"><PlanosTable planos={planos} /></Tab>
      <Tab label="Quiosques"><QuiosquesTable quiosques={quiosques} /></Tab>
    </Tabs>
  )
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `configuracoes` | Parâmetros gerais do clube |
| `planos` | Planos de associação |
| `quiosques` | Quiosques e espaços |
| `paginas_sistema` | Páginas do sistema (para permissões) |
| `tipos_exame` | Tipos de exame configuráveis |
| `tipos_infracao` | Tipos de infração configuráveis |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Todos os módulos** | Parâmetros e configurações alimentam todos os módulos |
| **Financeiro** | Valores dos planos, taxas de juros e multa |
| **Associados** | Planos disponíveis para vinculação |
| **Auth** | Páginas do sistema para controle de permissões |
| **Portaria** | Horários de funcionamento |
| **Exames** | Tipos e regras de validade |
| **Infrações** | Tipos e penalidades |

## Regras de Negócio

1. Alteração de valor de plano não afeta mensalidades já geradas
2. Plano inativo não pode ser vinculado a novos associados
3. Quiosque indisponível não aparece para reserva
4. Parâmetros financeiros são aplicados nas próximas gerações de mensalidade
5. Configurações possuem cache local para performance
6. Apenas administradores podem alterar configurações
