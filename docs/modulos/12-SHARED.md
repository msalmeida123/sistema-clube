# 🔧 Módulo: Shared

> Utilitários, helpers, hooks e componentes compartilhados entre todos os módulos.

## Visão Geral

O módulo Shared contém funções utilitárias, hooks genéricos e helpers que são utilizados por todos os outros módulos do sistema. Não possui repository ou service próprio — é uma camada de suporte transversal.

## Funcionalidades

- Formatadores (CPF, CNPJ, telefone, moeda, data)
- Validadores (CPF, CNPJ, email, telefone)
- Hooks genéricos (toast, debounce, localStorage, media queries)
- Constantes do sistema
- Tipos utilitários compartilhados
- Helpers de Supabase (cliente, error handling)

## Estrutura do Módulo

```
src/modules/shared/
├── types/index.ts              # Tipos compartilhados
├── utils/
│   ├── formatters.ts           # Formatadores
│   ├── validators.ts           # Validadores
│   ├── constants.ts            # Constantes
│   └── supabase.ts             # Helpers Supabase
├── hooks/
│   ├── useToast.ts             # Hook de notificações
│   ├── useDebounce.ts          # Hook de debounce
│   ├── useLocalStorage.ts      # Hook de localStorage
│   └── useMediaQuery.ts        # Hook de media queries
└── index.ts                    # Exports públicos
```

## Formatadores

```typescript
// Formatadores disponíveis
formatCPF('12345678901')           // '123.456.789-01'
formatCNPJ('12345678000195')       // '12.345.678/0001-95'
formatTelefone('11999998888')      // '(11) 99999-8888'
formatCurrency(1500.50)            // 'R$ 1.500,50'
formatDate('2025-01-15')           // '15/01/2025'
formatDateTime('2025-01-15T10:30') // '15/01/2025 10:30'
```

## Validadores

```typescript
// Validadores disponíveis
isValidCPF('123.456.789-01')       // true | false
isValidCNPJ('12.345.678/0001-95')  // true | false
isValidEmail('email@teste.com')    // true | false
isValidTelefone('(11) 99999-8888') // true | false
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useToast()` | Exibir notificações (success, error, warning, info) |
| `useDebounce(value, delay)` | Debounce para inputs de busca |
| `useLocalStorage(key, initial)` | Estado persistente no localStorage |
| `useMediaQuery(query)` | Detectar breakpoints responsivos |

## Uso

```tsx
import { 
  formatCPF, 
  formatCurrency, 
  isValidCPF, 
  useToast, 
  useDebounce 
} from '@/modules/shared'

export default function MeuComponente() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const handleSave = async () => {
    if (!isValidCPF(cpf)) {
      toast.error('CPF inválido')
      return
    }
    // ...
    toast.success('Salvo com sucesso!')
  }

  return (
    <div>
      <p>{formatCPF(associado.cpf)}</p>
      <p>{formatCurrency(mensalidade.valor)}</p>
    </div>
  )
}
```

## Constantes

```typescript
// Constantes do sistema
export const ESTADOS_BR = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  // ... todos os estados
]

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]
```

## Tipos Compartilhados

```typescript
interface Endereco {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
}

interface PaginationParams {
  page: number
  per_page: number
  total?: number
}

interface ApiResponse<T> {
  data: T
  error?: string
  count?: number
}
```

## Integração

Este módulo é importado por **todos os outros módulos** e não possui dependências externas além do Supabase client e libs de UI.
