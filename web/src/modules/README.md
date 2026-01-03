# Arquitetura Modular - Single Responsibility Principle

Sistema organizado em módulos independentes seguindo SRP (Single Responsibility Principle).

## Módulos Disponíveis

| Módulo | Types | Repository | Service | Hooks | Status |
|--------|-------|------------|---------|-------|--------|
| **associados** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **dependentes** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **financeiro** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **portaria** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **auth** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **crm** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **compras** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **eleicoes** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **exames** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **infracoes** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **configuracoes** | ✅ | ✅ | ✅ | ✅ | ✅ Completo |
| **shared** | ✅ | - | - | ✅ | ✅ Completo |

## Estrutura de um Módulo

```
src/modules/{modulo}/
├── types/index.ts              # Interfaces TypeScript
├── repositories/{mod}.repository.ts  # Acesso a dados
├── services/{mod}.service.ts         # Lógica de negócio
├── hooks/use{Mod}.ts                 # Hooks React
├── components/                       # Componentes UI
└── index.ts                          # Exports públicos
```

## Responsabilidades (SRP)

| Camada | Responsabilidade |
|--------|------------------|
| **Types** | Definir tipos TypeScript |
| **Repository** | CRUD no Supabase |
| **Service** | Validações e regras de negócio |
| **Hooks** | Estado React e side effects |
| **Components** | Renderização UI |

## Uso

```tsx
// Importar do módulo
import { useAssociados, AssociadosTable } from '@/modules/associados'
import { useMensalidades, useFinanceiroStats } from '@/modules/financeiro'
import { usePortaria, QRScanner, ValidacaoCard } from '@/modules/portaria'
import { useAuth, AuthProvider } from '@/modules/auth'
import { useContatos, useCRMStats } from '@/modules/crm'
import { useCompras, useFornecedores } from '@/modules/compras'
import { useEleicoes, useEleicoesMutations } from '@/modules/eleicoes'
import { useExames, useExamesStats } from '@/modules/exames'
import { useInfracoes, useInfracoesMutations } from '@/modules/infracoes'
import { useConfiguracao, usePlanos, useQuiosques } from '@/modules/configuracoes'
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
cd "C:\Users\Marcelo da Silva Alm\sistema-clube\web\src\modules"
.\create-module.ps1 novo-modulo
```

## Benefícios

1. **Testabilidade** - Cada camada testada isoladamente
2. **Manutenibilidade** - Mudanças localizadas
3. **Reutilização** - Components e hooks reutilizáveis
4. **Clareza** - Código organizado e previsível
5. **Escalabilidade** - Novos módulos seguem o padrão
6. **Onboarding** - Devs aprendem rápido
