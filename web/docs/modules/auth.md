# Módulo: Auth

Autenticação de usuários e sistema de permissões granulares (CRUD por página/perfil).

## Localização
`src/modules/auth/`

## Status
✅ Completo (Providers de Context em `components/`)

## Entidades principais
### `Usuario`
id, auth_id, nome, email, is_admin, permissoes[], perfil_acesso_id, setor, ativo.

### Sistema de permissões CRUD
- `PaginaSistema` — páginas do sistema (código, nome, rota, hierarquia via `pagina_pai_id`, `subpaginas`)
- `PermissaoCRUD` — pode_visualizar / pode_criar / pode_editar / pode_excluir
- `PermissaoUsuario` e `PermissaoPerfil` — permissão atribuída a um usuário ou a um perfil
- `PerfilAcesso` — perfil de acesso (grupo de permissões)
- `TipoAcao` — `visualizar | criar | editar | excluir`

### Permissões simples (legado)
- `Permissao` — enum de módulos (dashboard, associados, financeiro, crm, etc.)
- `TODAS_PERMISSOES`, `PERMISSOES_LABELS`, `ROTA_PARA_PAGINA` — constantes de mapeamento

## Hooks
- `useAuth`, `useLogin`, `useRegistro`
- `useUsuarios`, `useUsuariosMutations`
- `usePermissoesCRUD`, `usePermissaoPagina`, `useGerenciarPermissoes`

## Components (Context Providers)
- `AuthProvider` — contexto de sessão/usuário
- `PermissoesProvider` — contexto de permissões CRUD

## Repository / Service
- `AuthRepository` / `createAuthRepository`
- `AuthService` / `createAuthService`
- `permissoesRepository` (namespace com funções de permissões)

## Uso
```tsx
import { useAuth, AuthProvider, PermissoesProvider } from '@/modules/auth'

export default function Page() {
  const { user, isAuthenticated, isAdmin } = useAuth()
  // ...
}
```

## Relacionados
Todos os módulos dependem de `auth` para checagem de permissão de acesso às suas páginas (via `ROTA_PARA_PAGINA` e `PermissoesProvider`).
