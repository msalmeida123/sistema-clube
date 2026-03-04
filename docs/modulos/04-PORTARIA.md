# 🚪 Módulo: Portaria

> Controle de acesso ao clube via QR Code com validação em tempo real.

## Visão Geral

O módulo de Portaria gerencia o controle de entrada e saída do clube, utilizando leitura de QR Code para validação de associados e dependentes. Realiza verificações em tempo real de adimplência, exames médicos e status do cadastro.

## Funcionalidades

- Leitura de QR Code na entrada/saída
- Validação em tempo real (status, adimplência, exames)
- Registro de entradas e saídas por local (clube, piscina, academia)
- Controle de presentes no momento
- Dashboard com estatísticas de acesso
- Registro de acessos de convidados
- Alertas visuais para bloqueios e pendências
- Histórico de acessos por pessoa

## Estrutura do Módulo

```
src/modules/portaria/
├── types/index.ts                        # Interfaces e tipos
├── repositories/portaria.repository.ts   # CRUD no Supabase
├── services/portaria.service.ts          # Regras de negócio
├── hooks/usePortaria.ts                  # Hooks React
├── components/
│   ├── QRScanner.tsx                     # Leitor de QR Code
│   └── ValidacaoCard.tsx                 # Card de validação
└── index.ts                              # Exports públicos
```

## Tipos Principais

```typescript
type TipoAcesso = 'entrada' | 'saida'
type LocalAcesso = 'clube' | 'piscina' | 'academia'
type TipoPessoa = 'associado' | 'dependente' | 'convidado' | 'funcionario'

interface RegistroAcesso {
  id: string
  pessoa_id: string
  pessoa_nome?: string
  pessoa_foto?: string
  tipo_pessoa: TipoPessoa
  tipo: TipoAcesso
  local: LocalAcesso
  data_hora: string
  usuario_id?: string
  usuario_nome?: string
  observacao?: string
  created_at: string
}

interface PessoaAcesso {
  id: string
  nome: string
  foto_url?: string
  tipo: TipoPessoa
  status: 'ativo' | 'inativo' | 'suspenso'
  numero_titulo?: string
  titular_id?: string
  titular_nome?: string
  pode_acessar: boolean
  motivo_bloqueio?: string
  adimplente?: boolean
  exame_valido?: boolean
}

interface ValidacaoAcesso {
  permitido: boolean
  pessoa?: PessoaAcesso
  motivo?: string
  alertas?: string[]
}

interface AcessoStats {
  entradas_hoje: number
  saidas_hoje: number
  presentes_agora: number
  acessos_semana: number
}
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `usePortaria()` | Registros de acesso e validação |
| `useAcessoStats()` | Estatísticas de acesso em tempo real |
| `useValidarAcesso()` | Validação de QR Code |

## Uso

```tsx
import { usePortaria, QRScanner, ValidacaoCard } from '@/modules/portaria'

export default function PortariaPage() {
  const { validarQRCode, ultimoRegistro } = usePortaria()

  const handleScan = async (qrData: string) => {
    const resultado = await validarQRCode(qrData)
    // Exibe resultado da validação
  }

  return (
    <>
      <QRScanner onScan={handleScan} />
      {ultimoRegistro && <ValidacaoCard registro={ultimoRegistro} />}
    </>
  )
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `registros_acesso` | Log de entradas e saídas |
| `convidados` | Cadastro de convidados |

## Integrações com Outros Módulos

| Módulo | Relação |
|--------|---------|
| **Associados** | Validação de status e dados do sócio |
| **Dependentes** | Validação de dependentes na portaria |
| **Financeiro** | Verificação de adimplência |
| **Exames** | Verificação de exame médico válido |
| **Infrações** | Verificação de suspensões |

## Regras de Negócio

1. QR Code é único por pessoa (associado ou dependente)
2. Validação verifica: status ativo, adimplência e exame médico
3. Associado suspenso ou inativo tem acesso bloqueado
4. Acesso à piscina pode exigir exame médico válido (configurável)
5. Convidados precisam ser registrados previamente
6. Registros são armazenados com timestamp e operador
7. Dashboard mostra presentes em tempo real via Supabase Realtime
