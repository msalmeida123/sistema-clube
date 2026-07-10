# Arquitetura Modular - Single Responsibility Principle

Sistema organizado em módulos independentes seguindo SRP (Single Responsibility Principle).

## Módulos Disponíveis

| Módulo | Types | Repository | Service | Hooks | Components | Status |
|--------|-------|------------|---------|-------|-------------|--------|
| **associados** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **dependentes** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Sem UI própria |
| **financeiro** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Completo (possui `utils/`) |
| **portaria** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **auth** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Completo (Providers em `components/`) |
| **crm** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Sem UI própria |
| **compras** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Sem UI própria |
| **eleicoes** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Sem UI própria |
| **exames** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Sem UI própria |
| **infracoes** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Sem UI própria |
| **configuracoes** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Sem UI própria |
| **bar** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **rh** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Completo (possui `sql/`) |
| **shared** | ✅ | - | - | ✅ | - | ✅ Completo (utilitários cross-cutting) |

> ⚠️ **Sem UI própria**: o módulo expõe types/repository/service/hooks, mas a camada de UI vive
> diretamente nas páginas em `src/app/`. Isso é aceitável para módulos simples, mas se a tela
> crescer, vale extrair os componentes para `components/` do próprio módulo.

## Estrutura de um Módulo

```
src/modules/{modulo}/
├── types/index.ts              # Interfaces TypeScript
├── repositories/{mod}.repository.ts  # Acesso a dados
├── services/{mod}.service.ts         # Lógica de negócio
├── hooks/use{Mod}.ts                 # Hooks React (sem JSX)
├── components/                       # Componentes UI e Context Providers
└── index.ts                          # Exports públicos
```

## Responsabilidades (SRP)

| Camada | Responsabilidade |
|--------|------------------|
| **Types** | Definir tipos TypeScript |
| **Repository** | CRUD no Supabase |
| **Service** | Validações e regras de negócio |
| **Hooks** | Estado React e side effects (sem JSX) |
| **Components** | Renderização UI e Context Providers (ex: `AuthProvider`) |

> Regra prática: se o arquivo tem JSX (`return <... />`), ele pertence a `components/`,
> mesmo que seja um Context Provider. `hooks/` é só lógica (`.ts`, nunca `.tsx`).

## Uso

```tsx
// Importar do módulo
import { useAssociados, AssociadosTable } from '@/modules/associados'
import { useMensalidades, useFinanceiroStats } from '@/modules/financeiro'
import { usePortaria, QRScanner, ValidacaoCard } from '@/modules/portaria'
import { useAuth, AuthProvider, PermissoesProvider } from '@/modules/auth'
import { useContatos, useCRMStats } from '@/modules/crm'
import { useCompras, useFornecedores } from '@/modules/compras'
import { useEleicoes, useEleicoesMutations } from '@/modules/eleicoes'
import { useExames, useExamesStats } from '@/modules/exames'
import { useInfracoes, useInfracoesMutations } from '@/modules/infracoes'
import { useConfiguracao, usePlanos, useQuiosques } from '@/modules/configuracoes'
import { useBarProdutos, useCarrinho } from '@/modules/bar'
import { useRH, FuncionarioForm } from '@/modules/rh'
import { formatCPF, formatCurrency, useToast } from '@/modules/shared'

// Usar na página
export default function Page() {
  const { associados, loading } = useAssociados()
  const toast = useToast()

  return <AssociadosTable associados={associados} loading={loading} />
}
```

## Criar Novo Módulo

```powershell
cd "C:\Users\Marcelo da Silva Alm\projetos\sistema-clube\web\src\modules"
.\create-module.ps1 novo-modulo
```

## Benefícios

1. **Testabilidade** - Cada camada testada isoladamente
2. **Manutenibilidade** - Mudanças localizadas
3. **Reutilização** - Components e hooks reutilizáveis
4. **Clareza** - Código organizado e previsível
5. **Escalabilidade** - Novos módulos seguem o padrão
6. **Onboarding** - Devs aprendem rápido

## Histórico de limpeza

- **2026-06**: Removidos 9 arquivos órfãos (`*caos.repository.ts`, `*caos.service.ts`,
  `use*caos.ts`) em `eleicoes`, `infracoes` e `configuracoes` — sobras de uma geração de
  módulo com pluralização incorreta, nunca exportadas pelo `index.ts`.
- **2026-06**: `AuthProvider` e `PermissoesProvider` movidos de `auth/hooks/*.tsx` para
  `auth/components/*.tsx`, alinhando com a regra de que JSX pertence a `components/`.
