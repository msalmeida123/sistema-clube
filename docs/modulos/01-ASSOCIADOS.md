# 📋 Módulo: Associados

> Gerenciamento completo dos associados/sócios do clube.

## Visão Geral

O módulo de Associados é o núcleo do sistema, responsável pelo cadastro, consulta, atualização e gestão de todos os sócios do clube. Ele se integra diretamente com os módulos de Dependentes, Financeiro, Portaria e Exames.

## Funcionalidades

- Cadastro completo de associados (dados pessoais, endereço, contato)
- Busca e filtros avançados (nome, CPF, status, plano)
- Upload e gestão de fotos dos associados
- Geração de QR Code para acesso na portaria
- Controle de status (ativo, inativo, suspenso)
- Vinculação com planos e categorias
- Histórico de alterações
- Exportação de relatórios

## Estrutura do Módulo

```
src/modules/associados/
├── types/index.ts                        # Interfaces e tipos
├── repositories/associados.repository.ts # CRUD no Supabase
├── services/associados.service.ts        # Regras de negócio
├── hooks/useAssociados.ts                # Hooks React
├── components/
│   └── AssociadosTable.tsx               # Tabela de associados
└── index.ts                              # Exports públicos
```

## Tipos Principais

```typescript
interface Associado {
  id: string
  nome: string
  cpf: string
  rg?: string
  data_nascimento: string
  email?: string
  telefone?: string
  celular?: string
  endereco?: Endereco
  foto_url?: string
  numero_titulo: string
  categoria: CategoriaAssociado
  plano_id?: string
  status: StatusAssociado
  data_admissao: string
  data_desligamento?: string
  observacoes?: string
  created_at: string
  updated_at?: string
}

type StatusAssociado = 'ativo' | 'inativo' | 'suspenso' | 'inadimplente'
type CategoriaAssociado = 'titular' | 'remido' | 'honorario' | 'patrimonial'
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useAssociados(filters?)` | Lista associados com filtros opcionais |
| `useAssociado(id)` | Busca um associado por ID |
| `useAssociadosMutations()` | Create, update, delete de associados |

## Uso

```tsx
import { useAssociados, AssociadosTable } from '@/modules/associados'

export default function AssociadosPage() {
  const { associados, loading } = useAssociados({ status: 'ativo' })

  return <AssociadosTable associados={associados} loading={loading} />
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `associados` | Dados cadastrais dos sócios |
| `categorias_associados` | Categorias de associados |
| `associados_historico` | Log de alterações |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Dependentes** | Um associado pode ter N dependentes |
| **Financeiro** | Mensalidades vinculadas ao associado |
| **Portaria** | QR Code e controle de acesso |
| **Exames** | Exames médicos obrigatórios |
| **Infrações** | Registro de infrações do associado |
| **CRM** | Contato WhatsApp vinculado |

## Regras de Negócio

1. CPF deve ser único e válido
2. Número de título é gerado automaticamente
3. Associado suspenso não pode acessar o clube
4. Associado inadimplente pode ter acesso bloqueado (configurável)
5. Desligamento não exclui dados, apenas altera status
6. Foto é armazenada no Supabase Storage
