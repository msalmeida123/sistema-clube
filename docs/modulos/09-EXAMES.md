# 🏥 Módulo: Exames

> Controle de exames médicos obrigatórios para uso das instalações.

## Visão Geral

O módulo de Exames gerencia os exames médicos obrigatórios dos associados e dependentes, necessários para acesso a áreas como piscina e academia. Controla validade, pendências e alertas de vencimento.

## Funcionalidades

- Registro de exames médicos (associados e dependentes)
- Controle de validade e vencimento
- Tipos de exame configuráveis
- Upload de laudos e atestados (PDF/imagem)
- Alertas de exames próximos do vencimento
- Dashboard com estatísticas (válidos, vencidos, pendentes)
- Bloqueio de acesso para exames vencidos (integração portaria)
- Relatórios de pendências

## Estrutura do Módulo

```
src/modules/exames/
├── types/index.ts                      # Interfaces e tipos
├── repositories/exames.repository.ts   # CRUD no Supabase
├── services/exames.service.ts          # Regras de negócio
├── hooks/useExames.ts                  # Hooks React
└── index.ts                            # Exports públicos
```

## Tipos Principais

```typescript
type StatusExame = 'valido' | 'vencido' | 'pendente' | 'reprovado'
type TipoExame = 'clinico_geral' | 'dermatologico' | 'cardiologico' | 'oftalmologico' | 'outro'

interface ExameMedico {
  id: string
  pessoa_id: string
  pessoa_nome?: string
  tipo_pessoa: 'associado' | 'dependente'
  tipo_exame: TipoExame
  data_realizacao: string
  data_validade: string
  medico_nome?: string
  crm_medico?: string
  resultado: 'apto' | 'inapto' | 'apto_com_restricoes'
  restricoes?: string
  laudo_url?: string
  status: StatusExame
  observacoes?: string
  created_at: string
  updated_at?: string
}

interface ExameFilters {
  tipo_pessoa?: 'associado' | 'dependente'
  tipo_exame?: TipoExame
  status?: StatusExame
  pessoa_id?: string
  vencimento_proximo?: boolean // vence em 30 dias
}

interface ExamesStats {
  total_validos: number
  total_vencidos: number
  total_pendentes: number
  vencendo_30_dias: number
}
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useExames(filters?)` | Lista exames com filtros |
| `useExamesStats()` | Estatísticas de exames |
| `useExamesMutations()` | Registrar, atualizar exame |

## Uso

```tsx
import { useExames, useExamesStats } from '@/modules/exames'

export default function ExamesPage() {
  const { exames, loading } = useExames({ status: 'vencido' })
  const stats = useExamesStats()

  return (
    <>
      <ExamesStatsCards stats={stats} />
      <ExamesTable exames={exames} loading={loading} />
    </>
  )
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `exames_medicos` | Registros de exames |
| `tipos_exame` | Tipos de exame configuráveis |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Associados** | Exames vinculados ao associado |
| **Dependentes** | Exames vinculados ao dependente |
| **Portaria** | Verificação de exame válido no acesso |
| **CRM** | Notificação de vencimento via WhatsApp |
| **Configurações** | Tipos de exame e regras de validade |

## Regras de Negócio

1. Exame vencido bloqueia acesso à piscina (configurável)
2. Validade padrão é de 12 meses (configurável por tipo)
3. Laudos são armazenados no Supabase Storage
4. Alertas são disparados 30 dias antes do vencimento
5. Resultado "inapto" bloqueia imediatamente o acesso
6. Exames com restrições permitem acesso parcial
7. Histórico de exames é mantido por tempo indeterminado
