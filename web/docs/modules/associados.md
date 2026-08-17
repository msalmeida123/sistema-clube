# Módulo: Associados

Gestão do cadastro de sócios do clube — dados pessoais, endereço, plano e status.

## Localização
`src/modules/associados/`

## Status
✅ Completo (types, repository, service, hooks, components)

## Entidade principal: `Associado`
| Campo | Tipo | Observação |
|---|---|---|
| numero_titulo | string | número do título do sócio |
| nome, cpf, rg | string | dados pessoais |
| plano | `individual \| familiar \| patrimonial` | tipo de plano |
| status | `ativo \| inativo \| suspenso \| expulso` | situação do associado |
| dia_vencimento, valor_mensalidade | number | dados financeiros do plano |
| endereço completo | cep, endereco, numero, bairro, cidade, estado | |

Outros tipos: `AssociadoFilters`, `AssociadoFormData`, `AssociadoStats` (total, ativos, inativos, inadimplentes).

## Hooks
- `useAssociados` — lista/filtra associados
- `useAssociado` — busca um associado por id
- `useAssociadoMutations` — criar/editar/excluir

## Components
- `AssociadosTable` — tabela de listagem
- `AssociadoSearch` — busca/filtro

## Repository / Service
- `AssociadosRepository` / `createAssociadosRepository` — CRUD no Supabase
- `AssociadosService` / `createAssociadosService` — regras de negócio

## Uso
```tsx
import { useAssociados, AssociadosTable } from '@/modules/associados'

export default function Page() {
  const { associados, loading } = useAssociados()
  return <AssociadosTable associados={associados} loading={loading} />
}
```

## Relacionados
- `dependentes` (vínculo com associado titular)
- `financeiro` (mensalidades do associado)
- `portaria` (validação de acesso por status/adimplência)
