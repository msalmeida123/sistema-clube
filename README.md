<div align="center">

# 🏊 Sistema de Gestão de Clube

**Sistema completo para gestão de clubes sociais, recreativos e esportivos.**

[![Next.js](https://img.shields.io/badge/Next.js_14-000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org/)

[Demo](https://clube.mindforge.dev.br) · [App Mobile (PWA)](https://app.mindforge.dev.br) · [Reportar Bug](../../issues)

</div>

---

## 📋 Funcionalidades

### 👥 Gestão de Associados
- Cadastro completo de sócios (Individual, Familiar, Patrimonial)
- Gestão de dependentes
- Geração de QR Code único por associado
- Controle de status (ativo, inativo, suspenso, inadimplente)

### 💰 Módulo Financeiro
- Painel financeiro completo
- Gestão de mensalidades
- Carnês parcelados por categoria
- Contas a pagar

### 🚪 Controle de Acesso
- Portaria do Clube (entrada principal)
- Portaria da Academia
- Portaria da Piscina
- Leitura de QR Code
- Pagamento de mensalidades atrasadas na portaria (PIX/Cartão)

### 🎫 Convites
- Emissão de convites com QR Code
- Limite de 2 convites por mês
- Intervalo de 90 dias por convidado

### 🏕️ Quiosques
- Reserva de quiosques
- Abertura de reservas agendada (ex: sexta às 8h)
- Expiração automática (ex: às 9h do dia)
- Impressão de documento de reserva

### 🩺 Exames Médicos
- Controle de exames de admissão
- Validade de exames
- Liberação para academia/piscina

### ⚠️ Infrações
- Registro de infrações
- Aplicação de penalidades
- Histórico completo

### 🗳️ Eleições
- Sistema de votação eletrônica
- Cadastro de candidatos
- Apuração automática

### 📱 CRM WhatsApp
- Integração com WhatsApp (WaSender + Meta Cloud API)
- Respostas automáticas
- Bot com IA (GPT)
- Campanhas em massa
- Modelos de mensagens

### 🛡️ Permissões
- Perfis de acesso (Admin, Presidente, Financeiro, etc.)
- Permissões granulares por página
- Controle de ações (visualizar, criar, editar, excluir)

---

## 📱 Tecnologias

| Camada | Tecnologias |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **UI** | shadcn/ui (Radix UI), Lucide Icons |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Estado** | Zustand, TanStack Query, React Hook Form + Zod |
| **WhatsApp** | Factory Pattern — WaSender + Meta Cloud API |
| **Relatórios** | Recharts, jspdf, html5-qrcode |
| **Testes** | Jest 30, ts-jest |
| **Deploy** | Docker Swarm, GitHub Actions → GHCR, Traefik |

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Docker (opcional, para deploy)

### 1. Configurar Supabase

1. Crie um projeto no Supabase
2. Vá em **SQL Editor**
3. Execute o conteúdo do arquivo `sql/database.sql`
4. Copie a URL e a chave anônima do projeto (Settings > API)

### 2. Instalação Local

```bash
# Clonar repositório
git clone https://github.com/msalmeida123/sistema-clube.git
cd sistema-clube/web

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Editar .env.local com suas credenciais do Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui

# Iniciar em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### 3. Criar primeiro usuário administrador

1. Acesse a aplicação e faça cadastro/login
2. No Supabase, vá em **Table Editor > usuarios**
3. Encontre seu usuário e marque `is_admin = true`

---

## 🐳 Deploy com Docker

### Build local

```bash
cd sistema-clube

# Build da imagem
docker build -t sistema-clube ./web

# Executar
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave \
  --name sistema-clube \
  sistema-clube
```

### Docker Compose

```bash
# Criar arquivo .env
cp .env.example .env

# Editar .env com suas credenciais
nano .env

# Subir containers
docker-compose up -d
```

### Deploy com Portainer

1. No Portainer, vá em **Stacks > Add Stack**
2. Cole o conteúdo do `docker-compose.portainer.yml`:

```yaml
version: '3.8'

services:
  sistema-clube:
    image: ghcr.io/msalmeida123/sistema-clube:latest
    container_name: sistema-clube
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

networks:
  default:
    driver: bridge
```

3. Adicione as variáveis de ambiente:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | `https://seu-projeto.supabase.co` |
| `SUPABASE_ANON_KEY` | `sua-chave-anonima` |

4. Clique em **Deploy the stack**

---

## 🔧 Estrutura do Projeto

```
sistema-clube/
├── web/                    # Aplicação Next.js
│   ├── src/
│   │   ├── app/           # Páginas (App Router)
│   │   ├── modules/       # Módulos SRP
│   │   │   ├── associados/
│   │   │   ├── financeiro/
│   │   │   ├── portaria/
│   │   │   ├── crm/
│   │   │   └── ...
│   │   ├── components/    # Componentes compartilhados
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
│   ├── Dockerfile
│   └── package.json
├── sql/
│   └── database.sql       # Script do banco
├── docker-compose.yml
├── docker-compose.portainer.yml
└── README.md
```

---

## 📊 Banco de Dados

### Principais Tabelas

| Tabela | Descrição |
|---|---|
| `usuarios` | Funcionários/usuários do sistema |
| `associados` | Sócios do clube |
| `dependentes` | Dependentes dos sócios |
| `mensalidades` | Mensalidades dos associados |
| `carnes` | Carnês de pagamento |
| `parcelas_carne` | Parcelas dos carnês |
| `convites` | Convites para visitantes |
| `quiosques` | Quiosques disponíveis |
| `reservas_quiosque` | Reservas de quiosques |
| `registros_acesso` | Log de entradas/saídas |
| `exames_medicos` | Exames médicos |
| `infracoes` | Infrações/penalidades |
| `eleicoes` | Eleições |
| `whatsapp_*` | Tabelas do CRM WhatsApp |
| `paginas_sistema` | Páginas para controle de permissões |
| `perfis_acesso` | Perfis de usuário |
| `permissoes_*` | Permissões |

---

## 🔐 Sistema de Permissões

### Hierarquia

1. **Admin** (`is_admin = true`) → Acesso total
2. **Perfil de Acesso** → Modelo de permissões
3. **Permissões Individuais** → Sobrescrevem o perfil

### Perfis Disponíveis

| Perfil | Descrição |
|---|---|
| Administrador | Acesso total |
| Presidente | Acesso gerencial |
| Financeiro | Módulo financeiro |
| Secretaria | Cadastros e atendimento |
| Portaria | Controle de acesso |
| Atendimento | Atendimento básico |

---

## 📱 App Mobile

O **Clube Associado** é um PWA complementar para os associados do clube, disponível em [app.mindforge.dev.br](https://app.mindforge.dev.br). Veja o [repositório do app](https://github.com/msalmeida123/clube-associado).

---

## 📄 Licença

MIT License — Uso livre para fins comerciais e pessoais.

---

## 🤝 Suporte

Para dúvidas ou sugestões, abra uma [issue](../../issues) no repositório.

---

<div align="center">

Desenvolvido por [Marcelo Almeida](https://github.com/msalmeida123)

</div>
