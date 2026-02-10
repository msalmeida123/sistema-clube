# 🛒 Módulo: Compras

> Gestão de compras, fornecedores e cotações do clube.

## Visão Geral

O módulo de Compras gerencia todo o processo de aquisição de materiais e serviços do clube, desde o cadastro de fornecedores até o controle de pedidos, cotações e recebimentos.

## Funcionalidades

- Cadastro e gestão de fornecedores
- Solicitações de compra
- Cotações com múltiplos fornecedores
- Aprovação de compras (workflow)
- Registro de pedidos e recebimentos
- Controle de orçamento por categoria
- Relatórios de compras por período/fornecedor
- Histórico de preços

## Estrutura do Módulo

```
src/modules/compras/
├── types/index.ts                      # Interfaces e tipos
├── repositories/compras.repository.ts  # CRUD no Supabase
├── services/compras.service.ts         # Regras de negócio
├── hooks/useCompras.ts                 # Hooks React
└── index.ts                            # Exports públicos
```

## Tipos Principais

```typescript
type StatusPedido = 'rascunho' | 'solicitado' | 'cotacao' | 'aprovado' | 'comprado' | 'recebido' | 'cancelado'
type CategoriaProduto = 'material_limpeza' | 'material_escritorio' | 'alimentos' | 'manutencao' | 'equipamentos' | 'outros'

interface Fornecedor {
  id: string
  razao_social: string
  nome_fantasia?: string
  cnpj: string
  telefone?: string
  email?: string
  endereco?: string
  contato_nome?: string
  observacoes?: string
  ativo: boolean
  created_at: string
}

interface PedidoCompra {
  id: string
  numero: string
  fornecedor_id?: string
  fornecedor_nome?: string
  status: StatusPedido
  itens: ItemPedido[]
  valor_total: number
  data_solicitacao: string
  data_aprovacao?: string
  data_entrega_prevista?: string
  data_recebimento?: string
  solicitante_id: string
  solicitante_nome?: string
  aprovador_id?: string
  aprovador_nome?: string
  observacoes?: string
  created_at: string
}

interface ItemPedido {
  id: string
  pedido_id: string
  descricao: string
  categoria: CategoriaProduto
  quantidade: number
  unidade: string
  valor_unitario?: number
  valor_total?: number
}
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useCompras(filters?)` | Lista pedidos de compra |
| `useFornecedores()` | Lista fornecedores |
| `useComprasMutations()` | Criar pedido, aprovar, receber |

## Uso

```tsx
import { useCompras, useFornecedores } from '@/modules/compras'

export default function ComprasPage() {
  const { pedidos, loading } = useCompras({ status: 'solicitado' })
  const { fornecedores } = useFornecedores()

  return <PedidosTable pedidos={pedidos} loading={loading} />
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `fornecedores` | Cadastro de fornecedores |
| `pedidos_compra` | Pedidos de compra |
| `itens_pedido` | Itens de cada pedido |
| `cotacoes` | Cotações de preço |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Financeiro** | Compras geram lançamentos no financeiro |
| **Auth** | Aprovação depende de perfil de acesso |
| **Configurações** | Categorias e limites de aprovação |

## Regras de Negócio

1. Pedidos acima de determinado valor precisam de aprovação
2. CNPJ do fornecedor deve ser válido e único
3. Número do pedido é gerado automaticamente (sequencial)
4. Pedido cancelado não pode ser reativado
5. Recebimento confirma entrega e fecha o pedido
6. Cotações permitem comparação de preços entre fornecedores
