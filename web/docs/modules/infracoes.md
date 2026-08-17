# Módulo: Infrações

Registro e julgamento de infrações disciplinares cometidas por associados.

## Localização
`src/modules/infracoes/`

## Status
⚠️ Sem UI própria (types/repository/service/hooks; a UI vive nas páginas em `src/app/`)

## Entidade principal: `Infracao`
| Campo | Tipo | Observação |
|---|---|---|
| associado_id/nome | string | infrator |
| data_ocorrencia, local, descricao | | fatos da ocorrência |
| gravidade | `leve \| media \| grave \| gravissima` | |
| status | `registrada \| em_analise \| julgada \| arquivada` | fluxo de apuração |
| testemunhas, evidencias_url[] | | provas |
| penalidade | `advertencia \| suspensao \| multa \| expulsao` | resultado do julgamento |
| dias_suspensao, valor_multa, data_julgamento, parecer | | detalhes da penalidade |
| registrado_por | string | usuário que registrou |

Outros tipos: `InfracaoFilters`, `InfracaoFormData`, `InfracoesStats` (total, pendentes, este_mes, por_gravidade).

## Hooks
- `useInfracoes`, `useInfracao`, `useInfracoesMutations`
- `useInfracoesStats`

## Repository / Service
- `InfracoesRepository` / `createInfracoesRepository`
- `InfracoesService` / `createInfracoesService`

## Uso
```tsx
import { useInfracoes, useInfracoesStats } from '@/modules/infracoes'
```

## Relacionados
- `associados` (penalidade grave, ex. expulsão, pode alterar `status` do associado)
