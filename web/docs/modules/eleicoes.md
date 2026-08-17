# Módulo: Eleições

Gestão de eleições internas do clube (diretoria, conselho): candidatos, votação e apuração.

## Localização
`src/modules/eleicoes/`

## Status
⚠️ Sem UI própria (types/repository/service/hooks; a UI vive nas páginas em `src/app/`)

## Entidades principais
### `Eleicao`
título, descrição, data_inicio/fim, `status` (`agendada | em_andamento | encerrada | cancelada`), votos_brancos, total_votos, candidatos.

### `Candidato`
eleicao_id, nome, cargo, número, foto, proposta, votos.

### `Voto`
eleicao_id, associado_id, candidato_id (`null` = voto em branco), data_voto.

### `ResultadoEleicao`
Agregado de apuração: eleição + candidatos com percentual, total de votos, votos brancos, participação.

Outros tipos: `EleicaoFilters`, `EleicaoFormData`.

## Hooks
- `useEleicoes`, `useEleicao`, `useEleicoesMutations`

## Repository / Service
- `EleicoesRepository` / `createEleicoesRepository`
- `EleicoesService` / `createEleicoesService`

## Uso
```tsx
import { useEleicoes, useEleicoesMutations } from '@/modules/eleicoes'
```

## Relacionados
- `associados` (apenas associados aptos podem votar)
