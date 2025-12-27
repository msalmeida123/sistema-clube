# 🏊 Sistema de Gestão de Clube

Sistema completo para gestão de clubes sociais, recreativos e esportivos.

## 📋 Funcionalidades

### 👥 Gestão de Associados
- Cadastro completo de sócios (Individual, Familiar, Patrimonial)
- Gestão de dependentes
- Geração de QR Code único por associado
- Controle de status (ativo, inativo, suspenso, inadimplente)

### 💰 Módulo Financeiro
- Dashboard financeiro completo
- Gestão de mensalidades
- Carnês parcelados por categoria
- Contas a pagar
- Controle de compras

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
- Controle de utilização

### 🏕️ Quiosques
- Reserva de quiosques
- Abertura de reservas agendada (ex: sexta às 8h)
- Expiração automática (ex: às 9h do dia)
- Impressão de documento de reserva

### 🩺 Exames Médicos
- Controle de exames admissionais
- Validade de exames
- Liberação para academia/piscina

### ⚠️ Infrações
- Registro de ocorrências
- Aplicação de penalidades
- Histórico completo

### 🗳️ Eleições
- Sistema de votação eletrônica
- Cadastro de candidatos
- Apuração automática

### 📱 WhatsApp CRM
- Integração com WhatsApp
- Respostas automáticas
- Bot com IA (GPT)
- Campanhas em massa
- Templates de mensagens

### 🛡️ Permissões
- Perfis de acesso (Admin, Presidente, Financeiro, etc.)
- Permissões granulares por página
- Controle de ações (visualizar, criar, editar, excluir)

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
4. Copie a **URL** e **anon key** do projeto (Settings > API)

### 2. Instalação Local

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/sistema-clube.git
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

### 3. Criar Primeiro Usuário Admin

1. Acesse a aplicação e faça cadastro/login
2. No Supabase, vá em **Table Editor > usuarios**
3. Encontre seu usuário e marque `is_admin = true`

---

## 🐳 Deploy com Docker

### Build Local

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

### Deploy com Docker Compose

```bash
# Criar arquivo .env
cp .env.example .env

# Editar .env com suas credenciais
nano .env

# Subir containers
docker-compose up -d
```

---

## 📦 Deploy com Portainer

### 1. No Portainer, vá em **Stacks > Add Stack**

### 2. Cole o conteúdo do `docker-compose.portainer.yml`:

```yaml
version: '3.8'

services:
  sistema-clube:
    image: ghcr.io/seu-usuario/sistema-clube:latest
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

### 3. Adicione as variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| SUPABASE_URL | https://seu-projeto.supabase.co |
| SUPABASE_ANON_KEY | sua-chave-anonima |

### 4. Clique em **Deploy the stack**

---

## 🔧 Estrutura do Projeto

```
sistema-clube/
├── web/                    # Aplicação Next.js
│   ├── src/
│   │   ├── app/           # Páginas (App Router)
│   │   ├── components/    # Componentes React
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
│   ├── Dockerfile         # Build Docker
│   └── package.json
├── sql/
│   └── database.sql       # Script do banco
├── docker-compose.yml     # Docker Compose local
├── docker-compose.portainer.yml  # Stack Portainer
└── README.md
```

---

## 📊 Banco de Dados

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Funcionários/usuários do sistema |
| `associados` | Sócios do clube |
| `dependentes` | Dependentes dos sócios |
| `mensalidades` | Mensalidades |
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
| `paginas_sistema` | Páginas para permissões |
| `perfis_acesso` | Perfis de usuário |
| `permissoes_*` | Permissões |

---

## 🔐 Sistema de Permissões

### Hierarquia

1. **Admin** (`is_admin = true`) → Acesso total
2. **Perfil de Acesso** → Template de permissões
3. **Permissões Individuais** → Sobrescrevem o perfil

### Perfis Padrão

| Perfil | Descrição |
|--------|-----------|
| Administrador | Acesso total |
| Presidente | Acesso gerencial |
| Financeiro | Módulo financeiro |
| Secretaria | Cadastros e atendimento |
| Portaria | Controle de acesso |
| Atendimento | Atendimento básico |

---

## 📱 Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI**: shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Docker, Portainer

---

## 📄 Licença

MIT License - Uso livre para fins comerciais e pessoais.

---

## 🤝 Suporte

Para dúvidas ou sugestões, abra uma issue no repositório.
