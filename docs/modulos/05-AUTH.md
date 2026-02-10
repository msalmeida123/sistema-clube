# 🔐 Módulo: Auth

> Autenticação, autorização e gestão de permissões do sistema.

## Visão Geral

O módulo Auth gerencia todo o ciclo de autenticação e autorização do sistema, incluindo login, registro de usuários administrativos, perfis de acesso e permissões granulares por página (CRUD). Utiliza Supabase Auth como base.

## Funcionalidades

- Login com email/senha via Supabase Auth
- Gestão de usuários administrativos (funcionários)
- Perfis de acesso com permissões CRUD por página
- Controle granular: visualizar, criar, editar, excluir por módulo
- Middleware de proteção de rotas
- Sessão persistente com refresh token
- Logout e expiração de sessão

## Estrutura do Módulo

```
src/modules/auth/
├── types/index.ts                  # Interfaces e tipos
├── repositories/auth.repository.ts # Acesso a dados
├── services/auth.service.ts        # Regras de negócio
├── hooks/useAuth.ts                # Hooks React
└── index.ts                        # Exports públicos
```

## Tipos Principais

```typescript
interface Usuario {
  id: string
  email: string
  nome: string
  cargo?: string
  avatar_url?: string
  perfil_id?: string
  permissoes: Permissao[]
  ativo: boolean
  ultimo_acesso?: string
  created_at: string
}

interface PermissaoCRUD {
  pagina_id: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

interface PerfilAcesso {
  id: string
  nome: string
  descricao: string
  ativo: boolean
}

type Permissao = 
  | 'dashboard' | 'associados' | 'dependentes' | 'financeiro'
  | 'compras' | 'portaria' | 'exames' | 'infracoes'
  | 'eleicoes' | 'relatorios' | 'crm' | 'configuracoes' | 'usuarios'
```

## Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| `useAuth()` | Estado de autenticação (user, session, login, logout) |
| `usePermissoes()` | Verificação de permissões do usuário logado |
| `useUsuarios()` | CRUD de usuários administrativos |

## Uso

```tsx
import { useAuth, AuthProvider } from '@/modules/auth'

// Provider no layout
export default function Layout({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

// Nas páginas
function MinhaPage() {
  const { user, logout, temPermissao } = useAuth()

  if (!temPermissao('financeiro', 'visualizar')) {
    return <SemPermissao />
  }

  return <div>Bem-vindo, {user.nome}!</div>
}
```

## Tabelas no Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Dados dos usuários do sistema |
| `perfis_acesso` | Perfis de acesso (admin, operador, etc.) |
| `permissoes_perfil` | Permissões CRUD por perfil |
| `permissoes_usuario` | Permissões CRUD específicas por usuário |
| `paginas_sistema` | Páginas/módulos disponíveis |

## Regras de Negócio

1. Apenas usuários ativos podem fazer login
2. Permissões são verificadas por perfil + overrides por usuário
3. Usuário admin tem acesso total (não pode ser removido)
4. Sessão expira após período configurável
5. Rotas são protegidas via middleware Next.js
6. Permissões CRUD são granulares por página do sistema
