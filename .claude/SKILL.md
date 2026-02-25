---
name: sistema-clube
description: |
  Skill para desenvolvimento, manutenção e extensão do Sistema de Gestão de Clube.
  Use quando o usuário pedir para criar features, corrigir bugs, adicionar módulos,
  escrever testes, configurar deploy, ou qualquer tarefa relacionada ao projeto sistema-clube.
  Cobre: Next.js 14 App Router, Supabase, Docker Swarm, WhatsApp CRM, arquitetura modular SRP.
---

# Sistema Clube - Skill de Desenvolvimento

## Visão Geral

Sistema completo de gestão de clube social/esportivo com:
- **Web Admin** (Next.js 14) — Dashboard para funcionários e administração
- **App Associado** (Next.js PWA) — Portal mobile para sócios
- **WhatsApp CRM** — Atendimento via WhatsApp com múltiplos providers
- **Portaria** — Controle de acesso via QR Code (clube, academia, piscina, sauna)
- **Financeiro** — Mensalidades, cobranças, carnês
- **Eleições** — Sistema de votação eletrônica para o clube

**URL de produção:** `clube.mindforge.dev.br` (admin) / `app.mindforge.dev.br` (associado)

---

## Stack Técnico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| UI Components | Radix UI, Lucide React, shadcn/ui pattern |
| State | Zustand (global), React Query / TanStack Query (server state) |
| Forms | React Hook Form + Zod validation |
| Backend | Next.js API Routes (App Router), Server Components |
| Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Auth | Supabase Auth via `@supabase/auth-helpers-nextjs` |
| WhatsApp | WaSender API (primary) + Meta Cloud API (secondary) |
| QR Code | html5-qrcode (scanner) + qrcode (generator) |
| PDF | jspdf + html2canvas |
| Charts | Recharts |
| Deploy | Docker Swarm via Portainer, Traefik reverse proxy, GHCR |
| CI/CD | GitHub Actions → GHCR → Portainer webhook |
| Tests | Jest + ts-jest |

---

## Estrutura do Repositório

```
sistema-clube/
├── .github/workflows/
│   ├── docker-build.yml          # CI: Build → Push GHCR
│   └── deploy-app-associado.yml  # CI: App associado
├── web/                          # ★ PROJETO PRINCIPAL
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── (auth)/           # Rotas públicas (login, reset-password)
│   │   │   ├── (dashboard)/      # Rotas protegidas (layout com sidebar)
│   │   │   │   └── dashboard/    # Todas as páginas do sistema
│   │   │   ├── api/              # API Routes
│   │   │   │   ├── wasender/     # Endpoints WhatsApp (WaSender)
│   │   │   │   ├── whatsapp/     # Endpoints WhatsApp (genérico)
│   │   │   │   ├── whatsapp-meta/ # Webhook Meta
│   │   │   │   ├── openai/       # Proxy OpenAI para bot IA
│   │   │   │   ├── upload/       # Upload de arquivos
│   │   │   │   └── usuarios/     # Gestão de usuários
│   │   │   └── auth/callback/    # OAuth callback
│   │   ├── components/           # Componentes globais
│   │   │   ├── ui/               # Componentes base (shadcn pattern)
│   │   │   ├── dashboard/        # Widgets do dashboard
│   │   │   ├── Sidebar.tsx       # Navegação lateral
│   │   │   └── SecurityProvider.tsx
│   │   ├── hooks/                # Hooks globais
│   │   ├── lib/                  # Utilitários core
│   │   │   ├── supabase.ts       # Cliente Supabase (browser)
│   │   │   ├── supabase/client.ts
│   │   │   ├── security.ts       # Rate limiting, sanitização
│   │   │   ├── sanitize.ts       # XSS protection
│   │   │   └── whatsapp/         # ★ Provider factory pattern
│   │   │       ├── factory.ts    # Cria provider baseado em config DB
│   │   │       ├── provider.ts   # Interface base
│   │   │       ├── wasender-provider.ts
│   │   │       └── meta-provider.ts
│   │   ├── modules/              # ★ ARQUITETURA MODULAR SRP
│   │   │   ├── associados/
│   │   │   ├── dependentes/
│   │   │   ├── financeiro/
│   │   │   ├── portaria/
│   │   │   ├── auth/
│   │   │   ├── crm/
│   │   │   ├── compras/
│   │   │   ├── eleicoes/
│   │   │   ├── exames/
│   │   │   ├── infracoes/
│   │   │   ├── configuracoes/
│   │   │   └── shared/           # Utils compartilhados
│   │   ├── types/database.ts     # Tipos do banco de dados
│   │   ├── middleware.ts         # Auth + Security headers
│   │   └── __tests__/            # Testes unitários
│   ├── Dockerfile                # Multi-stage build
│   ├── jest.config.ts
│   ├── next.config.js            # CSP + Security headers
│   ├── package.json
│   └── tailwind.config.js
├── database/                     # Migrations SQL
├── sql/                          # Scripts SQL auxiliares
├── docs/                         # Documentação
├── docker-compose.swarm.yml      # ★ Deploy produção (Portainer)
├── docker-compose.yml            # Dev local
└── CHANGELOG.md
```

---

## Arquitetura Modular (SRP)

Cada módulo segue o padrão **Single Responsibility Principle**:

```
src/modules/{modulo}/
├── types/index.ts                    # Interfaces TypeScript
├── repositories/{mod}.repository.ts  # CRUD Supabase (dados)
├── services/{mod}.service.ts         # Lógica de negócio + validações
├── hooks/use{Mod}.ts                 # React hooks (estado + side effects)
├── components/                       # UI específica do módulo
└── index.ts                          # Re-exports públicos
```

### Responsabilidades de Cada Camada

| Camada | Faz | NÃO faz |
|--------|-----|---------|
| **Types** | Define interfaces TS | Lógica, imports de libs |
| **Repository** | CRUD no Supabase, queries | Validação, regras de negócio |
| **Service** | Validação, regras de negócio, formatação | Acesso direto ao Supabase, state React |
| **Hooks** | Estado React, mutations, side effects | Lógica de negócio complexa |
| **Components** | Renderização UI | Acesso ao banco, lógica de negócio |

### Criando um Novo Módulo

Use o script PowerShell:
```powershell
cd "C:\Users\Marcelo da Silva Alm\projetos\sistema-clube\web\src\modules"
.\create-module.ps1 nome-do-modulo
```

Ou crie manualmente seguindo a estrutura acima. Sempre adicione o módulo à tabela no `README.md` dos modules.

---

## Módulos Existentes

| Módulo | Descrição | Complexidade |
|--------|-----------|-------------|
| **associados** | CRUD de sócios, busca, carteirinha, contrato | Alta |
| **dependentes** | Dependentes de associados | Média |
| **financeiro** | Mensalidades, cobranças, relatórios financeiros | Alta |
| **portaria** | Controle acesso QR Code (clube/academia/piscina/sauna) | Alta |
| **auth** | Autenticação, permissões RBAC | Alta |
| **crm** | WhatsApp CRM, contatos, conversas, setores | Alta |
| **compras** | Gestão de compras e fornecedores | Média |
| **eleicoes** | Votação eletrônica do clube | Média |
| **exames** | Exames médicos (obrigatório para academia/piscina) | Média |
| **infracoes** | Infrações e penalidades de associados | Média |
| **configuracoes** | Planos, quiosques, configurações gerais | Média |
| **shared** | Formatadores (CPF, CNPJ, moeda), validadores, utils | Baixa |

---

## Tipos do Banco de Dados

Tipos principais definidos em `src/types/database.ts`:

```typescript
// Status de associado
type StatusAssociado = 'ativo' | 'inativo' | 'suspenso' | 'expulso'

// Tipos de plano
type TipoPlano = 'individual' | 'familiar' | 'patrimonial'

// Pagamentos
type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado'
type TipoPagamento = 'boleto' | 'pix'
type TipoCobranca = 'mensalidade_clube' | 'mensalidade_academia' | 'taxa_familiar'

// Setores/Roles
type SetorUsuario = 'admin' | 'presidente' | 'vice_presidente' | 'diretoria' 
  | 'financeiro' | 'secretaria' | 'portaria_clube' | 'portaria_piscina' 
  | 'portaria_academia' | 'atendimento'
```

---

## WhatsApp Integration

O sistema usa um **Factory Pattern** para suportar múltiplos providers WhatsApp:

```
lib/whatsapp/
├── provider.ts         # Interface WhatsAppProvider
├── factory.ts          # createProvider() + getDefaultProvider()
├── wasender-provider.ts # Implementação WaSender API
└── meta-provider.ts     # Implementação Meta Cloud API
```

**Fluxo de envio:**
1. `getDefaultProvider()` busca o provider `is_default=true` e `ativo=true` da tabela `whatsapp_providers`
2. Cria instância via `createProvider(config)`
3. Chama `provider.sendMessage()` / `provider.sendImage()` etc.

**Webhook:** A rota `/api/wasender/webhook` recebe mensagens do WaSender e salva na tabela `crm_mensagens`.

**IMPORTANTE:** O `SUPABASE_SERVICE_ROLE_KEY` é necessário no server-side para operações WhatsApp (buscar provider config). Este key deve ser passado como env var no Docker, NÃO hardcoded no build.

---

## Autenticação e Segurança

### Middleware (`src/middleware.ts`)
- Headers de segurança (X-Frame-Options, HSTS, CSP, etc.)
- Verificação de sessão Supabase para rotas protegidas
- Rotas públicas: `/login`, `/reset-password`, `/api/webhooks`
- Redirect para `/login` se não autenticado

### Content Security Policy (`next.config.js`)
- CSP configurado para permitir Supabase, WhatsApp, OpenAI
- `frame-ancestors 'none'` previne clickjacking
- Cache desabilitado para rotas API

### Segurança no Código
- `lib/security.ts` — Rate limiting, IP tracking
- `lib/sanitize.ts` — Sanitização de inputs contra XSS
- `components/ui/safe-input.tsx` — Input com sanitização automática
- `SecurityProvider.tsx` — Console protection em produção

### Permissões RBAC
- Tabela `permissoes` no Supabase
- Hook `usePermissoes()` para verificar permissões no frontend
- Setores definem acesso granular por funcionalidade

---

## Deploy e Infraestrutura

### Pipeline CI/CD
```
git push main → GitHub Actions → Build Docker → Push GHCR → Portainer Webhook → Deploy
```

### Docker Build (Multi-stage)
1. **Builder stage:** `node:20-alpine`, instala deps, build Next.js
2. **Runner stage:** `node:20-alpine`, copia standalone output, roda como user `nextjs`
3. Output: `standalone` (configurado em `next.config.js`)

### Docker Swarm (Produção)
- **Stack:** `docker-compose.swarm.yml` via Portainer
- **Network:** `network_swarm_public` (Traefik)
- **Traefik labels** para roteamento automático HTTPS
- **Health check:** Node.js fetch em `localhost:3000`
- **Restart policy:** on-failure, max 3 attempts

### Variáveis de Ambiente

| Variável | Onde | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build + Runtime | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build + Runtime | Chave anônima (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Build ARG + Runtime ENV | Chave de serviço (SECRETA) |
| `WASENDER_WEBHOOK_SECRET` | Runtime | Secret para validar webhooks |
| `NODE_ENV` | Runtime | `production` em prod |

**⚠️ CUIDADO com SERVICE_ROLE_KEY:**  
Deve ser passada tanto como build-arg (para rotas API compiladas) quanto como env var runtime.
No `docker-compose.swarm.yml`, está definida diretamente. No GitHub Actions, vem de `secrets.SUPABASE_SERVICE_ROLE_KEY`.

---

## Testes

### Configuração
- **Framework:** Jest 30 + ts-jest
- **Config:** `jest.config.ts` com `moduleNameMapper` para `@/` alias
- **Ambiente:** `node` (não jsdom)

### Estrutura de Testes
```
src/__tests__/
├── lib/
│   ├── sanitize.test.ts
│   ├── security.test.ts
│   ├── utils.test.ts
│   └── whatsapp/
│       ├── factory.test.ts
│       ├── meta-provider.test.ts
│       └── wasender-provider.test.ts
└── modules/
    ├── associados/associados.service.test.ts
    ├── financeiro/formatters.test.ts
    ├── portaria/portaria.service.test.ts
    └── shared/utils.test.ts
```

### Padrão de Testes
- Testar **services** (lógica de negócio) com mocks dos repositories
- Testar **utils/lib** diretamente (funções puras)
- Mock do Supabase client para testes de repository quando necessário

### Comandos
```bash
npm test              # Rodar testes
npm run test:coverage # Com relatório de cobertura
```

---

## Convenções de Código

### Nomenclatura
- **Arquivos:** kebab-case (`portaria.service.ts`)
- **Componentes:** PascalCase (`ValidacaoCard.tsx`)
- **Hooks:** camelCase com `use` prefix (`usePortaria.ts`)
- **Types:** PascalCase (`StatusAssociado`)
- **Variáveis de env:** UPPER_SNAKE_CASE

### Imports
```typescript
// 1. Libs externas
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 2. Módulos internos (alias @/)
import { supabase } from '@/lib/supabase'
import { useAssociados } from '@/modules/associados'

// 3. Tipos
import type { Associado } from '@/types/database'
```

### Padrão de Página (App Router)
```typescript
// src/app/(dashboard)/dashboard/nome-pagina/page.tsx
'use client'

import { useModulo } from '@/modules/nome-modulo'

export default function NomePaginaPage() {
  const { data, loading } = useModulo()
  
  if (loading) return <Skeleton />
  return <ComponentePrincipal data={data} />
}
```

### Padrão de API Route
```typescript
// src/app/api/endpoint/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // ... lógica
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
```

---

## Regras de Negócio Importantes

### Portaria / Controle de Acesso
- Associado deve estar `ativo` para entrar
- Associado `suspenso` ou `inativo` → acesso negado
- Verificar **adimplência** (mensalidades em dia)
- **Academia e Piscina** exigem exame médico válido
- Sistema detecta automaticamente entrada/saída pelo último registro
- QR Code identifica associados e dependentes

### Dependentes
- Dependente herda status de adimplência do **titular**
- Se titular `inativo`/`suspenso` → dependente também bloqueado
- Exame médico é individual (dependente pode ter próprio exame)

### Financeiro
- Tipos de cobrança: mensalidade_clube, mensalidade_academia, taxa_familiar
- Status: pendente → pago / atrasado → cancelado
- Inadimplência bloqueia acesso na portaria

### CRM WhatsApp
- Conversas organizadas por **setores** (Kanban)
- Múltiplos providers (WaSender + Meta)
- Respostas automáticas configuráveis
- Bot IA opcional (OpenAI)
- Notificações em tempo real via Supabase Realtime

---

## Troubleshooting Comum

### "Nenhum provider WhatsApp configurado"
- Verificar tabela `whatsapp_providers` tem registro `ativo=true` e `is_default=true`
- Verificar `SUPABASE_SERVICE_ROLE_KEY` está válida no container Docker
- Testar key: `curl -H "apikey: KEY" -H "Authorization: Bearer KEY" SUPABASE_URL/rest/v1/whatsapp_providers`

### Build Docker falha
- Verificar `SUPABASE_SERVICE_ROLE_KEY` está nos secrets do GitHub
- Limpar cache: `docker buildx build --no-cache`
- Build local: `docker build --build-arg SUPABASE_SERVICE_ROLE_KEY=xxx -t sistema-clube ./web`

### Deploy não atualiza
- Verificar Portainer webhook está configurado
- Forçar pull: `docker service update --force --image ghcr.io/msalmeida123/sistema-clube:latest`
- Verificar network: serviço deve estar em `network_swarm_public`

### Testes falhando com module not found
- Verificar `moduleNameMapper` no `jest.config.ts` para alias `@/`
- Rodar `npm install` para garantir dependências

---

## Checklists

### Adicionando Nova Feature
1. [ ] Identificar módulo existente ou criar novo
2. [ ] Definir types em `types/index.ts`
3. [ ] Implementar repository (CRUD Supabase)
4. [ ] Implementar service (lógica de negócio)
5. [ ] Criar hook React
6. [ ] Criar página em `app/(dashboard)/dashboard/`
7. [ ] Adicionar rota na Sidebar se necessário
8. [ ] Escrever testes para o service
9. [ ] Testar localmente com `npm run dev`
10. [ ] Commit + push → CI/CD automático

### Adicionando Nova API Route
1. [ ] Criar em `app/api/nome/route.ts`
2. [ ] Usar `SUPABASE_SERVICE_ROLE_KEY` se server-side
3. [ ] Adicionar rate limiting se exposta publicamente
4. [ ] Se webhook: adicionar à lista `apiRoutesWithOwnAuth` no middleware
5. [ ] Atualizar CSP no `next.config.js` se conectar a domínio externo

### Deploy Manual
```bash
# 1. Build e push imagem
docker build --build-arg SUPABASE_SERVICE_ROLE_KEY=xxx -t ghcr.io/msalmeida123/sistema-clube:latest ./web
docker push ghcr.io/msalmeida123/sistema-clube:latest

# 2. Update no swarm (via SSH no VPS)
docker service update --force --image ghcr.io/msalmeida123/sistema-clube:latest sistema-clube_sistema-clube
```
