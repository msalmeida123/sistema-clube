# 👨‍👩‍👧‍👦 Módulo: Dependentes

> Gestão dos dependentes vinculados aos associados titulares.

## Visão Geral

O módulo de Dependentes permite o cadastro e gerenciamento de familiares e dependentes dos associados titulares. Cada dependente herda o vínculo com o clube através do titular e possui regras específicas de acesso e cobrança.

## Funcionalidades

- Cadastro de dependentes vinculados a um titular
- Definição de grau de parentesco
- Controle de faixa etária e categoria
- Upload de foto e documentos
- Geração de QR Code individual para portaria
- Controle de status independente do titular
- Listagem por associado titular

## Estrutura do Módulo

```
src/modules/dependentes/
├── types/index.ts                          # Interfaces e tipos
├── repositories/dependentes.repository.ts  # CRUD no Supabase
├── services/dependentes.service.ts         # Regras de negócio
├── hooks/useDependentes.ts                 # Hooks React
└── index.ts                                # Exports públicos
```

## Tipos Principais

```typescript
interface Dependente {
  id: string
  associado_id: string
  associado_nome?: string
  nome: string
  cpf?: string
  rg?: string
  data_nascimento: string
  parentesco: GrauParentesco
  telefone?: string
  email?: string
  foto_url?: string
  status: StatusDependente
  observacoes?: string
  created_at: string
  updated_at?: string
}

type GrauParentesco = 'conjuge' | 'filho' | 'filha' | 'pai' | 'mae' | 'outro'
type StatusDependente = 'ativo' | 'inativo' | 'suspenso'
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useDependentes(associado_id?)` | Lista dependentes (opcionalmente por titular) |
| `useDependente(id)` | Busca um dependente por ID |
| `useDependentesMutations()` | Create, update, delete de dependentes |

## Uso

```tsx
import { useDependentes } from '@/modules/dependentes'

export default function DependentesPage() {
  const { dependentes, loading } = useDependentes(associadoId)

  if (loading) return <Skeleton />
  return <DependentesTable data={dependentes} />
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `dependentes` | Dados cadastrais dos dependentes |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Associados** | Dependente pertence a um associado titular |
| **Portaria** | QR Code e controle de acesso individual |
| **Exames** | Exames médicos obrigatórios |
| **Infrações** | Registro de infrações do dependente |

## Regras de Negócio

1. Dependente deve estar vinculado a um associado titular ativo
2. Limite de dependentes pode ser configurado por plano
3. Se o titular for desligado, dependentes são inativados automaticamente
4. Dependentes menores de idade não precisam de CPF
5. Dependentes possuem QR Code próprio para acesso
6. Status do dependente é independente, mas subordinado ao titular
