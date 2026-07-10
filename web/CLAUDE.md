# Design Context — Sistema Clube

> Contexto de design deste projeto. Fontes canônicas: [`PRODUCT.md`](./PRODUCT.md) (estratégia) e [`DESIGN.md`](./DESIGN.md) (sistema visual). Leia-as antes de mexer em UI.

- **Register:** `product` — UI a serviço da tarefa (dashboards, tabelas, formulários operacionais), não site de marca.
- **Usuários:** equipe do clube por papel (gestão, secretaria, financeiro, portaria, bar, atendimento), familiaridade técnica variada; uso diário e prolongado.
- **Personalidade:** confiável e eficiente. Estrela-Guia: *"O Painel de Controle"*.
- **Prioridade nº 1:** consistência visual entre as muitas telas.

## Regras visuais (de DESIGN.md)

- **Uma cor de ação:** Azul de Confiança `#2563EB` (`--primary`) para botão primário, item ativo, foco e seleção. Nenhuma seção ganha cor de marca própria (sem âmbar/verde/roxo ad-hoc). *A Regra da Voz Única.*
- **Tipografia:** Inter única, escala `rem` fixa (sem `clamp()` fluido). Hierarquia por peso/tamanho.
- **Superfícies planas em repouso;** elevação só como resposta a estado. Sem cards aninhados.
- **Componentes:** vocabulário único shadcn/ui (Radix + CVA). Todo interativo com os 7 estados. Skeletons no carregamento; estados vazios que ensinam.
- **Acessibilidade:** AA + usuários não-técnicos. Contraste AA (nunca cinza-claro em corpo de texto), foco de teclado visível, alvos ~44px na linha de frente, `prefers-reduced-motion`, estado nunca só por cor.

## Anti-referências (evitar)

- Sistema **gov/legado** (cinza morto, densidade sem hierarquia).
- **Template genérico** shadcn azul saído da caixa, sem sistema próprio.
- Navegação canônica: a `<aside>` em `src/app/(dashboard)/layout.tsx`. Não reintroduzir um segundo sidebar (o legado `src/components/Sidebar.tsx` foi removido).
