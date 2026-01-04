# 🏛️ SISTEMA DE GESTÃO DE CLUBE SOCIAL

## Documentação Completa para Desenvolvimento e Manutenção

---

## 📋 VISÃO GERAL

### Sobre o Sistema
Sistema completo de gestão para clubes sociais, desenvolvido com arquitetura moderna e modular. Permite gerenciamento de associados, dependentes, controle financeiro, portaria com QR Code, eleições, infrações, exames médicos, CRM com WhatsApp e muito mais.

### Stack Tecnológica
| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **UI Components** | Shadcn/ui, Tailwind CSS, Lucide Icons |
| **Backend/BaaS** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **Containerização** | Docker, Docker Swarm |
| **Proxy Reverso** | Traefik v2 (SSL automático via Let's Encrypt) |
| **CI/CD** | GitHub Actions |
| **Hospedagem** | VPS Linux (Ubuntu) |

### Informações de Ambiente
```
Domínio: clube.mindforge.dev.br
VPS IP: 31.220.72.244
Recursos: 6 cores, 12GB RAM
Container Registry: ghcr.io/msalmeida123/sistema-clube
```

---

## 🏗️ ARQUITETURA DO SISTEMA

### Estrutura de Pastas (Padrão Modular)
```
web/
├── src/
│   ├── app/                          # App Router (Next.js 14)
│   │   ├── (auth)/                   # Rotas de autenticação
│   │   │   └── login/
│   │   ├── (dashboard)/              # Rotas protegidas
│   │   │   └── dashboard/
│   │   │       ├── associados/
│   │   │       ├── dependentes/
│   │   │       ├── financeiro/
│   │   │       ├── portaria/
│   │   │       ├── compras/
│   │   │       ├── eleicoes/
│   │   │       ├── exames-medicos/
│   │   │       ├── infracoes/
│   │   │       ├── crm/
│   │   │       ├── configuracoes/
│   │   │       └── permissoes/
│   │   ├── api/                      # API Routes
│   │   └── layout.tsx
│   │
│   ├── modules/                      # MÓDULOS (Arquitetura Principal)
│   │   ├── associados/
│   │   │   ├── types/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   ├── dependentes/
│   │   ├── financeiro/
│   │   ├── portaria/
│   │   ├── auth/
│   │   ├── crm/
│   │   ├── compras/
│   │   ├── eleicoes/
│   │   ├── exames/
│   │   ├── infracoes/
│   │   ├── configuracoes/
│   │   └── shared/
│   │
│   ├── components/
│   │   └── ui/                       # Componentes Shadcn/ui
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   └── utils.ts
│   │
│   └── types/
│       └── database.ts
│
├── public/
├── sql/                              # Scripts SQL
│   └── permissoes_crud.sql
├── Dockerfile
├── docker-compose.yml
├── docker-compose.swarm.yml
└── .github/
    └── workflows/
        └── docker-build.yml
```

### Padrão de Módulo (Obrigatório)
Cada módulo deve seguir esta estrutura:

```
modules/[nome_modulo]/
├── types/
│   └── index.ts          # Interfaces e tipos TypeScript
├── repositories/
│   └── [nome].repository.ts   # Acesso a dados (Supabase)
├── services/
│   └── [nome].service.ts      # Lógica de negócio
├── hooks/
│   └── use[Nome].ts           # React Hooks customizados
├── components/
│   └── [Componente].tsx       # Componentes específicos do módulo
└── index.ts                   # Barrel export
```

---

## 🔐 SISTEMA DE AUTENTICAÇÃO E PERMISSÕES

### Autenticação
- **Provider**: Supabase Auth
- **Método**: Email/Senha
- **Sessão**: JWT com refresh automático
- **Middleware**: Proteção de rotas via `middleware.ts`

### Sistema de Permissões CRUD
Controle granular por página com 4 níveis:

| Permissão | Descrição |
|-----------|-----------|
| `visualizar` | Pode ver a página e dados |
| `criar` | Pode criar novos registros |
| `editar` | Pode modificar registros existentes |
| `excluir` | Pode remover registros |

### Uso nas Páginas
```tsx
import { PaginaProtegida, ComPermissao } from '@/components/ui/permissao'

export default function AssociadosPage() {
  return (
    <PaginaProtegida codigoPagina="associados">
      <div className="p-6">
        {/* Botão só aparece se tiver permissão de criar */}
        <ComPermissao codigoPagina="associados" acao="criar">
          <Button>Novo Associado</Button>
        </ComPermissao>
        
        {/* Botão só aparece se tiver permissão de editar */}
        <ComPermissao codigoPagina="associados" acao="editar">
          <Button>Editar</Button>
        </ComPermissao>
        
        {/* Botão só aparece se tiver permissão de excluir */}
        <ComPermissao codigoPagina="associados" acao="excluir">
          <Button variant="destructive">Excluir</Button>
        </ComPermissao>
      </div>
    </PaginaProtegida>
  )
}
```

---

## 📊 MÓDULOS DO SISTEMA

### 1. Associados
- Cadastro completo de associados
- Upload de foto
- Geração de QR Code único
- Gestão de status (ativo, inativo, suspenso, expulso)
- Planos: Individual, Familiar, Patrimonial
- Geração de carteirinha digital
- Geração de contrato

### 2. Dependentes
- Cadastro de dependentes (apenas planos Familiar e Patrimonial)
- Tipos de parentesco configuráveis
- Limite de idade para filhos (21 anos, 24 se universitário)

### 3. Financeiro
- Dashboard com resumo financeiro
- Gestão de mensalidades
- Carnês e parcelas
- Convites pagos
- Contas a pagar
- Registro de compras

### 4. Portaria
- Controle de acesso por QR Code
- Busca por CPF ou número do título
- Verificação de mensalidades em atraso
- Pagamento na portaria (PIX, Crédito, Débito)
- Registro de entrada de convidados

### 5. Compras/Orçamentos
- Solicitação de orçamentos
- Comparação de fornecedores
- Aprovação/Reprovação

### 6. Eleições
- Criação de eleições
- Cadastro de chapas
- Votação por associado
- Apuração automática

### 7. Exames Médicos
- Cadastro de exames (obrigatório para piscina)
- Controle de validade
- Alertas de vencimento

### 8. Infrações
- Registro de ocorrências
- Classificação por gravidade
- Fluxo de análise e julgamento
- Aplicação de penalidades

### 9. CRM (WhatsApp)
- Integração com WhatsApp via WaSender API
- Envio de mensagens e mídias
- Templates de mensagens
- Respostas automáticas com IA

---

## 🔌 APIs E INTEGRAÇÕES

### Supabase (Obrigatório)
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### WaSender API (WhatsApp)
```env
WASENDER_API_KEY=sua_api_key
WASENDER_DEVICE_ID=seu_device_id
```

---

## ✅ BOAS PRÁTICAS DE MANUTENÇÃO

### Nomenclatura
- Arquivos: kebab-case (`associados.repository.ts`)
- Componentes: PascalCase (`AssociadoCard.tsx`)
- Funções/Variáveis: camelCase (`fetchAssociados`)
- Constantes: UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`)

### Checklist para Nova Página
- [ ] Criar entrada em `paginas_sistema`
- [ ] Adicionar permissões padrão aos perfis
- [ ] Adicionar `<PaginaProtegida>` no componente
- [ ] Adicionar `<ComPermissao>` nos botões de ação
- [ ] Adicionar item no menu (layout.tsx)

### Deploy
```bash
# Criar release
.\release.ps1 -tipo patch  # ou minor, major

# Deploy manual (se necessário)
docker service update --image ghcr.io/msalmeida123/sistema-clube:latest sistema-clube_web
```

---

## 📝 CHANGELOG

### v1.1.3
- Sistema de permissões CRUD completo

### v1.1.2
- Simplificação da portaria

### v1.1.1
- GitHub Actions CI/CD

### v1.1.0
- Todos os 12 módulos

### v1.0.0
- Release inicial

---

*Documentação atualizada em: Janeiro/2025*
