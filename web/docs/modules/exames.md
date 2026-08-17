# Módulo: Exames Médicos

Controle de exames médicos obrigatórios de associados e dependentes (ex. para liberar acesso à academia/piscina).

## Localização
`src/modules/exames/`

## Status
⚠️ Sem UI própria (types/repository/service/hooks; a UI vive nas páginas em `src/app/`)

## Entidade principal: `ExameMedico`
| Campo | Tipo | Observação |
|---|---|---|
| pessoa_id, tipo_pessoa | string, `associado \| dependente` | quem fez o exame |
| data_exame, data_validade | string | período de validade |
| medico_nome, crm_medico, clinica | string | dados do profissional |
| resultado, observacoes, arquivo_url | string | laudo anexado |
| status | `pendente \| aprovado \| reprovado \| vencido` | |

Outros tipos: `ExameFilters` (inclui `vencidos`, `a_vencer` em dias), `ExameFormData`, `ExamesStats` (total, aprovados, vencidos, a_vencer_30dias).

## Hooks
- `useExames`, `useExame`, `useExamesMutations`
- `useExamesStats`

## Repository / Service
- `ExamesRepository` / `createExamesRepository`
- `ExamesService` / `createExamesService`

## Uso
```tsx
import { useExames, useExamesStats } from '@/modules/exames'
```

## Relacionados
- `associados` / `dependentes` (pessoa avaliada)
- `portaria` (checagem `exame_valido` na validação de acesso à academia/piscina)
