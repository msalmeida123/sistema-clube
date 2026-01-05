# Clube do Associado - App Mobile

App mobile para associados do clube com design moderno estilo Apple/Material Design.

## Funcionalidades

- 🔐 **Login seguro** com CPF e senha
- 🔑 **Recuperação de senha** via email
- 📱 **QR Code digital** para acesso às dependências
- 💰 **Visualização de mensalidades** (pagas, pendentes, atrasadas)
- 👤 **Perfil do associado** com informações pessoais

## Tecnologias

- React Native + Expo
- Expo Router (navegação)
- Supabase (autenticação e banco de dados)
- TypeScript
- Design System inspirado no iOS/Android

## Instalação

```bash
cd mobile-associado
npm install
npx expo start
```

## Estrutura

```
mobile-associado/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx         # Tela de login
│   │   └── forgot-password.tsx # Recuperar senha
│   ├── (app)/
│   │   ├── home.tsx          # QR Code
│   │   ├── mensalidades.tsx  # Mensalidades
│   │   └── perfil.tsx        # Perfil
│   └── _layout.tsx           # Layout principal
├── components/
│   ├── Button.tsx
│   ├── TextInput.tsx
│   └── Card.tsx
├── lib/
│   ├── supabase.ts           # Configuração Supabase
│   ├── auth.tsx              # Context de autenticação
│   └── theme.ts              # Tema e cores
└── assets/
```

## Design

- Cores iOS (Blue, Green, Purple)
- Gradientes modernos
- Cards com sombras sutis
- Animações com Haptic Feedback
- SafeArea para notch/Dynamic Island
- Tab Bar estilo iOS

## Fluxo de Autenticação

1. Usuário digita CPF e senha
2. Sistema busca associado pelo CPF
3. Faz login com email/senha no Supabase Auth
4. Carrega dados do associado
5. Redireciona para Home (QR Code)

## Recuperação de Senha

1. Usuário digita CPF
2. Sistema busca email cadastrado
3. Envia link de recuperação para o email
4. Usuário redefine senha pelo link
