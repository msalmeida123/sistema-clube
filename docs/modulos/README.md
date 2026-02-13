# 📘 Sistema Clube — Documentação dos Módulos

> Sistema de gestão completo para clubes recreativos, sociais e esportivos.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **UI** | Shadcn/ui, Tailwind CSS, Lucide Icons |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **Infra** | Docker Swarm, Traefik v2 (SSL), GitHub Actions |
| **Domínio** | clube.mindforge.dev.br |

---

## Arquitetura Modular (SRP)

Cada módulo segue o padrão **Single Responsibility Principle**:

```
src/modules/{modulo}/
├── types/index.ts              # Interfaces TypeScript
├── repositories/{mod}.repository.ts  # Acesso a dados (Supabase)
├── services/{mod}.service.ts         # Regras de negócio
├── hooks/use{Mod}.ts                 # Hooks React
├── components/                       # Componentes UI
└── index.ts                          # Exports públicos
```

| Camada | Responsabilidade |
|--------|------------------|
| **Types** | Definição de tipos e interfaces |
| **Repository** | CRUD direto no Supabase |
| **Service** | Validações e lógica de negócio |
| **Hooks** | Estado React e side effects |
| **Components** | Renderização UI |

---

## Módulos do Sistema

| # | Módulo | Arquivo | Descrição |
|---|--------|---------|-----------| 
| 01 | 📋 Associados | [01-ASSOCIADOS.md](01-ASSOCIADOS.md) | Gestão de sócios/associados |
| 02 | 👨‍👩‍👧‍👦 Dependentes | [02-DEPENDENTES.md](02-DEPENDENTES.md) | Gestão de dependentes |
| 03 | 💰 Financeiro | [03-FINANCEIRO.md](03-FINANCEIRO.md) | Mensalidades, cobranças, fluxo de caixa |
| 04 | 🚪 Portaria | [04-PORTARIA.md](04-PORTARIA.md) | Controle de acesso via QR Code |
| 05 | 🔐 Auth | [05-AUTH.md](05-AUTH.md) | Autenticação e permissões |
| 06 | 💬 CRM | [06-CRM.md](06-CRM.md) | WhatsApp, contatos e campanhas |
| 07 | 🛒 Compras | [07-COMPRAS.md](07-COMPRAS.md) | Fornecedores e pedidos |
| 08 | 🗳️ Eleições | [08-ELEICOES.md](08-ELEICOES.md) | Votação eletrônica |
| 09 | 🏥 Exames | [09-EXAMES.md](09-EXAMES.md) | Exames médicos obrigatórios |
| 10 | ⚠️ Infrações | [10-INFRACOES.md](10-INFRACOES.md) | Infrações disciplinares |
| 11 | ⚙️ Configurações | [11-CONFIGURACOES.md](11-CONFIGURACOES.md) | Parâmetros do sistema |
| 12 | 🔧 Shared | [12-SHARED.md](12-SHARED.md) | Utilitários compartilhados |

---

## Mapa de Integrações

```
                    ┌──────────────┐
                    │    Auth      │
                    │  (Permissões)│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼──┐  ┌──────▼────┐  ┌───▼──────────┐
     │ Associados │  │Dependentes│  │Configurações │
     └────┬───┬───┘  └─────┬────┘  └───┬──────────┘
          │   │             │           │
    ┌─────▼───▼─────────────▼───────────▼──┐
    │              Financeiro               │
    └─────┬────────────┬───────────────────┘
          │            │
    ┌─────▼────┐  ┌────▼────┐
    │ Portaria │  │   CRM   │
    └─────┬────┘  └─────────┘
          │
    ┌─────▼────┐  ┌─────────┐  ┌──────────┐
    │  Exames  │  │Infrações│  │ Eleições │
    └──────────┘  └─────────┘  └──────────┘
                                    
    ┌──────────┐  ┌─────────┐
    │ Compras  │  │ Shared  │ ← usado por todos
    └──────────┘  └─────────┘
```

---

## Versões

| Tag | Descrição |
|-----|-----------|
| `v1.0.0` | Deploy inicial |
| `v1.1.0` | Arquitetura Modular SRP (12 módulos) |

---

## Como Criar um Novo Módulo

```powershell
cd web/src/modules
.\create-module.ps1 nome-do-modulo
```

Isso gera automaticamente a estrutura: `types/`, `repositories/`, `services/`, `hooks/` e `index.ts`.
