# Módulo: Dependentes

Cadastro de dependentes vinculados a um associado titular (cônjuge, filhos, pais, etc.).

## Localização
`src/modules/dependentes/`

## Status
⚠️ Sem UI própria (types/repository/service/hooks; a UI vive nas páginas em `src/app/`)

## Entidade principal: `Dependente`
| Campo | Tipo | Observação |
|---|---|---|
| associado_id | string | titular ao qual o dependente pertence |
| nome, cpf, rg, data_nascimento, sexo | | dados pessoais |
| parentesco | `conjuge \| filho \| filha \| pai \| mae \| outro` | |
| status | `ativo \| inativo` | |
| associado | objeto opcional | dados resumidos do titular (id, nome, numero_titulo) |

Outros tipos: `DependenteFilters`, `DependenteFormData`.

## Hooks
- `useDependentes`, `useDependente`, `useDependentesMutations`

## Repository / Service
- `DependentesRepository` / `createDependentesRepository`
- `DependentesService` / `createDependentesService`

## Uso
```tsx
import { useDependentes } from '@/modules/dependentes'
```

## Relacionados
- `associados` (relação titular → dependente)
- `portaria` (dependente herda adimplência do titular para liberar acesso)
- `exames` (exames médicos exigidos também para dependentes, ex. academia/piscina)
