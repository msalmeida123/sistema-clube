# Módulo: Shared

Utilitários e hooks transversais, usados por todos os demais módulos.

## Localização
`src/modules/shared/`

## Status
✅ Completo (utilitários cross-cutting — não segue a estrutura types/repository/service dos demais módulos)

## Utils (`utils/index.ts`)
### Formatadores
- `formatCPF`, `formatCNPJ`, `formatPhone`, `formatCEP`
- `formatCurrency` (BRL via `Intl.NumberFormat`)
- `formatDate`, `formatDateTime`, `formatTime` (locale `pt-BR`)

### Validadores
- `isValidCPF` (validação com dígitos verificadores)
- `isValidEmail`
- `isValidPhone`

### Helpers
- `cleanDocument` — remove máscara de documentos
- `getInitials` — iniciais do nome para avatar
- `slugify` — normaliza texto para slug
- `debounce` — debounce genérico de função
- `sleep` — espera assíncrona

## Hooks
- `useToast` — notificações/toasts

## Uso
```tsx
import { formatCPF, formatCurrency, useToast } from '@/modules/shared'
```

## Relacionados
Consumido por praticamente todos os módulos (`associados`, `financeiro`, `bar`, `rh`, etc.) para formatação e validação padronizadas.
