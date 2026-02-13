# 💰 Módulo: Financeiro

> Gestão de mensalidades, carnês, cobranças e fluxo de caixa do clube.

## Visão Geral

O módulo Financeiro é responsável por toda a gestão financeira do clube, incluindo geração de mensalidades, controle de pagamentos, carnês, inadimplência e relatórios financeiros.

## Funcionalidades

- Geração automática de mensalidades por plano
- Controle de pagamentos (pago, pendente, vencido, cancelado)
- Geração de carnês com múltiplas parcelas
- Registro de pagamentos manuais e automáticos
- Dashboard com indicadores financeiros (receita, inadimplência, previsão)
- Relatórios de inadimplência
- Histórico financeiro por associado
- Integração com PIX para pagamentos

## Estrutura do Módulo

```
src/modules/financeiro/
├── types/index.ts                          # Interfaces e tipos
├── repositories/financeiro.repository.ts   # CRUD no Supabase
├── services/financeiro.service.ts          # Regras de negócio
├── hooks/useFinanceiro.ts                  # Hooks React
├── components/
│   ├── MensalidadesTable.tsx               # Tabela de mensalidades
│   └── FinanceiroStatsCards.tsx            # Cards de estatísticas
└── index.ts                                # Exports públicos
```

## Tipos Principais

```typescript
interface Mensalidade {
  id: string
  associado_id: string
  associado_nome?: string
  plano_id?: string
  plano_nome?: string
  valor: number
  valor_pago?: number
  desconto?: number
  juros?: number
  multa?: number
  mes_referencia: number
  ano_referencia: number
  data_vencimento: string
  data_pagamento?: string
  status: StatusMensalidade
  forma_pagamento?: FormaPagamento
  observacoes?: string
  created_at: string
}

type StatusMensalidade = 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'parcial'
type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia'

interface FinanceiroStats {
  receita_mes: number
  receita_ano: number
  inadimplencia_total: number
  mensalidades_pendentes: number
  mensalidades_vencidas: number
  taxa_inadimplencia: number
}
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useMensalidades(filters?)` | Lista mensalidades com filtros |
| `useMensalidade(id)` | Busca uma mensalidade por ID |
| `useFinanceiroStats()` | Estatísticas financeiras gerais |
| `useFinanceiroMutations()` | Registrar pagamento, gerar carnê, etc. |

## Uso

```tsx
import { useMensalidades, useFinanceiroStats, MensalidadesTable, FinanceiroStatsCards } from '@/modules/financeiro'

export default function FinanceiroPage() {
  const stats = useFinanceiroStats()
  const { mensalidades, loading } = useMensalidades({ status: 'pendente' })

  return (
    <>
      <FinanceiroStatsCards stats={stats} />
      <MensalidadesTable data={mensalidades} loading={loading} />
    </>
  )
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `mensalidades` | Registros de mensalidades |
| `pagamentos` | Histórico de pagamentos |
| `carnes` | Carnês gerados |
| `planos` | Planos e valores |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Associados** | Mensalidades vinculadas ao associado |
| **Configurações** | Planos e valores definidos nas configurações |
| **Portaria** | Inadimplência pode bloquear acesso |
| **CRM** | Envio de cobrança via WhatsApp |

## Regras de Negócio

1. Mensalidades são geradas automaticamente com base no plano do associado
2. Após vencimento, aplica-se juros e multa (configurável)
3. Pagamento parcial é permitido
4. Associado com mais de X meses inadimplente é suspenso automaticamente
5. Carnês podem ser gerados com parcelamento customizado
6. Desconto por antecipação é configurável por plano
7. Relatórios de inadimplência disponíveis por período
