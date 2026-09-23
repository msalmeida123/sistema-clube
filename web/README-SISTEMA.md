# Sistema Clube — mapa técnico

Este arquivo é o índice do código. As regras de negócio continuam nos módulos e serviços; os comentários de módulo explicam o papel de cada arquivo sem duplicar a implementação.

## Tecnologia e execução

- Next.js 15 com App Router e React 19.
- TypeScript com alias `@/*` apontando para `src/*`.
- Supabase para autenticação, PostgreSQL, Storage e políticas RLS.
- Tailwind CSS e componentes reutilizáveis em `src/components/ui`.
- O processo web é gerado pelo Dockerfile deste diretório e executado pelo serviço `sistema-clube_sistema-clube`.

## Onde encontrar cada parte

| Área | Local | Responsabilidade |
| --- | --- | --- |
| Login e recuperação | `src/app/(auth)` | Telas públicas e sessão do usuário |
| Painel administrativo | `src/app/(dashboard)` | Rotas protegidas do sistema |
| Área do associado | `src/app/associado` | Carteirinha, mensalidades, exames, relatos e mensagens |
| APIs | `src/app/api` | Operações de servidor e integrações externas |
| Domínio | `src/modules` | Componentes, hooks, repositórios e serviços por módulo |
| Componentes comuns | `src/components` | Layout, navegação, formulários e UI |
| Supabase | `src/lib/supabase` | Clientes browser/server, sessão e acesso ao banco |
| Tema | `src/lib/tema` e `src/app/api/tema` | Personalização por clube e variáveis CSS |
| WhatsApp | `src/lib/whatsapp` e `src/app/api/whatsapp*` | CRM, provedores e webhooks |
| Testes | `src/__tests__` | Testes unitários, integração e regras de negócio |

## Fluxo padrão de uma tela

1. A rota em `src/app` monta a página e verifica a sessão.
2. O componente usa hooks e componentes compartilhados.
3. Leitura e gravação passam por um service/repository em `src/modules` ou por uma API em `src/app/api`.
4. O Supabase aplica o tenant pela sessão e pelas políticas RLS; nunca use um `clube_id` livre vindo do navegador.
5. Mensagens de sucesso/erro usam o sistema de toast existente.

## Banco e migrations

Os scripts SQL na pasta `outputs/sistema-clube-web` documentam alterações incrementais (planos, carnês, QR Code, mensagens, tema e permissões). Antes de criar uma migration, procure a tabela e a função existentes e preserve os dados atuais.

## Comandos úteis

```bash
npm run lint
npx tsc --noEmit
npm test -- --runInBand
npm run build
```

Para publicar, use a imagem Docker definida em `outputs/sistema-clube-web/sistema-clube.yml`. O build precisa terminar sem falhas antes de atualizar o serviço.

## Convenções de manutenção

- Prefira comentários no início de módulos e nas decisões de segurança; não comente operações óbvias.
- Valide entrada no cliente e no servidor.
- Mantenha textos de interface em português e mensagens técnicas fora da resposta ao usuário.
- Para alterações visuais, reutilize tokens e componentes existentes.
