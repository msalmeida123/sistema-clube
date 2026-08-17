# Módulo: Portaria

Controle de acesso do clube via QR Code — entrada/saída, validação de elegibilidade (status, adimplência, exame médico).

## Localização
`src/modules/portaria/`

## Status
✅ Completo

## Entidades principais
### `RegistroAcesso` (alias: `Acesso`)
pessoa_id/nome/foto, `tipo_pessoa` (`associado | dependente | convidado | funcionario`), `tipo` (`entrada | saida`), `local` (`clube | piscina | academia`), data_hora, usuario que registrou, observação.

### `PessoaAcesso`
Snapshot da pessoa para exibição no scanner: status (`ativo | inativo | suspenso`), titular (para dependentes), flags `pode_acessar`, `motivo_bloqueio`, `adimplente`, `exame_valido`.

### `ValidacaoAcesso`
Resultado da checagem: `permitido`, pessoa, motivo, alertas[].

Outros tipos: `RegistroFilters`, `AcessoStats` (entradas_hoje, saidas_hoje, presentes_agora, acessos_semana), `AcessoFilters`, `AcessoFormData`.

## Hooks
- `usePortaria`
- `useValidacaoAcesso`
- `useRegistroAcesso`
- `useAcessos`

## Components
- `QRScanner` — leitura do QR Code do associado/dependente
- `ValidacaoCard` — exibe resultado da validação (usa tokens `--success`/`--warning` do design system)
- `RegistrosRecentes` — lista de últimos acessos

## Repository / Service
- `PortariaRepository` / `createPortariaRepository`
- `PortariaService` / `createPortariaService`
- Repository específico: `acessos.repository.ts`

## Regras de negócio
- QR Code valida status ativo + adimplência
- Acesso à academia/piscina exige exame médico válido
- Dependente herda adimplência do titular
- Auto-detecção de entrada/saída
- Loop de agente construído em n8n: QR → Supabase → checagens de elegibilidade → log em `portaria_acessos` → notificação via WaSender
- Um **agente local** (fora do n8n) está planejado para leitura de QR/código de barras e impressoras, falando direto com Supabase/Next.js

## Uso
```tsx
import { usePortaria, QRScanner, ValidacaoCard } from '@/modules/portaria'
```

## Relacionados
- `associados`, `dependentes` (elegibilidade)
- `financeiro` (adimplência)
- `exames` (validade do exame médico)
