---
name: Sistema Clube
description: Sistema de gestão de clube — UI de produto, sóbria e consistente, construída sobre shadcn/ui + Tailwind.
colors:
  primary: "#2563EB"
  primary-foreground: "#F8FAFC"
  ink: "#020817"
  background: "#FFFFFF"
  surface-muted: "#F1F5F9"
  muted-foreground: "#64748B"
  border: "#E2E8F0"
  destructive: "#EF4444"
  destructive-foreground: "#F8FAFC"
  success: "#16A34A"
  success-foreground: "#F8FAFC"
  warning: "#B45309"
  warning-foreground: "#F8FAFC"
  primary-dark: "#3B82F6"
typography:
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  data:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Sistema Clube

## 1. Overview

**Creative North Star: "O Painel de Controle"**

O Sistema Clube é um instrumento de trabalho, não uma vitrine. Como um bom painel de controle, cada informação tem seu mostrador, a leitura é imediata e nada compete pela atenção sem motivo. A equipe do clube — gestão, secretaria, financeiro, portaria, bar, atendimento — opera aqui o dia inteiro; a interface precisa ser confiável e eficiente antes de ser bonita, e é justamente essa sobriedade disciplinada que a torna bonita.

O sistema é construído sobre shadcn/ui + Tailwind, com um azul de confiança como única cor de ação e uma base neutra fria (família *slate*) para tudo o mais. A profundidade é discreta: superfícies planas em repouso, uma sombra mínima nos cards, e feedback de elevação apenas em resposta a interação. Densidade é proposital — muita quando o papel pede (financeiro, relatórios), enxuta na linha de frente (portaria, bar).

Este sistema **rejeita** duas coisas explicitamente. Primeiro, o visual de **sistema público legado**: cinza morto, tabelas pesadas sem respiro, ausência de estados de foco/hover, densidade sem hierarquia. Segundo, o **template genérico**: o azul shadcn saído da caixa, indistinguível de qualquer boilerplate, e — corolário do estado atual do código — as cores ad-hoc por seção (âmbar, verde, roxo, vermelho soltos) que fazem o produto parecer amador. A meta declarada nº 1 é **consistência visual**: um único vocabulário, tela a tela.

**Key Characteristics:**
- Um azul de ação, uma base neutra fria — nada de cor decorativa.
- Plano em repouso; elevação só como resposta a estado.
- Tipografia única (Inter) em escala fixa, hierarquia por peso e tamanho.
- Densidade responde à tarefa e ao papel, nunca ao acaso.
- Consistência acima de novidade: dois jeitos de fazer a mesma coisa = um está errado.

## 2. Colors

Paleta de produto **Restrained**: uma base neutra fria carrega as superfícies, e um único azul de confiança carrega toda a ação e seleção. Os valores canônicos vivem como variáveis HSL em `src/app/globals.css` (`--primary`, `--foreground`, etc.); os hex no frontmatter são as conversões sRGB equivalentes.

### Primary
- **Azul de Confiança** (#2563EB · `hsl(221 83% 53%)` · `--primary`): a única cor de ação. Botões primários, item de navegação ativo, seleção atual, anel de foco (`--ring`), indicadores de estado. Nunca decoração. No modo escuro clareia para **#3B82F6** (`--primary` dark) para manter contraste sobre a superfície escura.

### Neutral
- **Tinta** (#020817 · `hsl(222 84% 5%)` · `--foreground`): texto principal e títulos. Quase-preto com leve viés frio, não preto puro.
- **Branco** (#FFFFFF · `--background`): superfície de conteúdo e de cards no modo claro.
- **Superfície Suave** (#F1F5F9 · `hsl(210 40% 96%)` · `--secondary`/`--muted`/`--accent`): fundos de segundo nível, hover neutro, painéis, linhas zebradas.
- **Cinza de Legenda** (#64748B · `hsl(215 16% 47%)` · `--muted-foreground`): texto secundário, descrições, placeholders. **Piso de contraste:** só sobre branco; nunca sobre a Superfície Suave em corpo de texto.
- **Traço** (#E2E8F0 · `hsl(214 32% 91%)` · `--border`/`--input`): bordas, divisores e contorno de campos.

### Semantic
Três semânticos de **estado** (não de marca) para tarefas que os exigem — leitura semafórica na linha de frente (portaria, bar). Nenhum deles é cor de ação: continuam subordinados à Regra da Voz Única, sempre pareados com ícone/texto.
- **Alerta** (#EF4444 · `hsl(0 84% 60%)` · `--destructive`): erro, exclusão, ação irreversível, acesso negado. Sempre pareado com ícone/texto — nunca cor sozinha comunicando estado.
- **Sucesso** (#16A34A · `hsl(142 71% 40%)` · `--success`): confirmação, acesso liberado, operação concluída. Uso típico como tinta (`bg-success/10`, `text-success`, `border-success/50`); sólido (`bg-success text-success-foreground`) só em botão de ação positiva.
- **Aviso** (#B45309 · `hsl(32 95% 34%)` · `--warning`): atenção **não-bloqueante** — titular em atraso, exame próximo do vencimento. Informa sem impedir. Tom escuro o bastante para AA em corpo de texto pequeno sobre tinta clara.

### Named Rules
**A Regra da Voz Única.** Existe **uma** cor de ação: o Azul de Confiança. Sucesso, aviso e info podem usar semânticos padrão quando a tarefa exige, mas nenhuma seção do sistema ganha sua própria cor de marca (o âmbar do bar, o verde do WhatsApp, o roxo do admin). Consistência é a identidade.

## 3. Typography

**Body & Display Font:** Inter (via `next/font/google`), com fallback `system-ui, sans-serif`.

**Character:** Uma única família humanista-neutra carrega tudo — título, corpo, rótulo, dado. É a escolha certa para produto: sem par display/corpo, sem fontes competindo. A hierarquia vem de peso e tamanho, não de troca de família.

### Hierarchy
- **Headline** (600, 1.5rem/`text-2xl`, lh 1.1, tracking -0.01em): títulos de card e de página (`CardTitle`).
- **Title** (600, 1.125rem/`text-lg`, lh 1.25): título da barra superior, cabeçalhos de seção.
- **Body** (400, 0.875rem/`text-sm`, lh 1.5): texto corrente, conteúdo de formulário. Prosa longa limitada a 65–75ch.
- **Label** (500, 0.875rem/`text-sm`): rótulos de campo, itens de navegação, texto de botão.
- **Data** (500, 0.75rem/`text-xs`): metadados densos, badges, legendas de tabela.

### Named Rules
**A Regra da Escala Fixa.** Tamanhos em `rem` fixos, nunca `clamp()` fluido. O usuário opera em DPI consistente; um h1 fluido que encolhe dentro de uma sidebar fica pior, não melhor. Densidade responde por breakpoint estrutural, não por tipografia elástica.

**A Regra da Legenda Legível.** O Cinza de Legenda (#64748B) é para texto secundário sobre branco, com contraste AA. Nunca rebaixar corpo de texto para cinza-claro "por elegância" — é a causa nº 1 de tela ilegível para porteiros e secretaria.

## 4. Elevation

Sistema **plano por padrão** com elevação tonal. Em repouso, superfícies são planas e separadas por cor (Branco sobre Superfície Suave) e por Traço (#E2E8F0), não por sombra. A única sombra ambiente permanente é o `shadow-sm` dos cards e da barra superior fixa. Profundidade real (dropdowns, dialogs, toasts) é responsabilidade dos primitivos Radix, empilhados por uma escala de z-index semântica, não por valores arbitrários.

### Shadow Vocabulary
- **Repouso** (`box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)` · `shadow-sm`): cards e o header fixo. Presença, não drama.
- **Sobreposição** (sombra do Radix `Popover`/`Dialog`): menus, seletores, diálogos. Aplicada pelo componente, não à mão.

### Named Rules
**A Regra do Plano em Repouso.** Superfícies não têm sombra em descanso além do `shadow-sm` do card. Elevação aparece como **resposta a estado** (hover, foco, sobreposição), nunca como decoração de layout. Se parece um app de 2014, a sombra está escura demais e o blur pequeno demais.

## 5. Components

Vocabulário único de componentes shadcn/ui (Radix + CVA + `tailwind-merge`). O mesmo botão, o mesmo campo, o mesmo estilo de ícone (Lucide) em toda tela. Todo componente interativo carrega os estados: default, hover, focus-visible, active, disabled.

### Buttons
- **Shape:** cantos suaves (6px · `rounded-md`); altura padrão 40px (`h-10`), `sm` 36px, `lg` 44px.
- **Primary:** `bg-primary` + `text-primary-foreground`, padding `8px 16px`. Hover: `bg-primary/90`.
- **Outline:** borda `--input` sobre `--background`; hover preenche com `--accent`.
- **Secondary / Ghost / Link:** neutros; ghost sem fundo até hover. Destructive: `bg-destructive`.
- **Focus:** anel de 2px na cor `--ring` com offset de 2px (`focus-visible:ring-2`). Sempre visível — requisito de teclado.
- **Disabled:** `opacity-50` + `pointer-events-none`.

### Cards / Containers
- **Corner Style:** 8px (`rounded-lg`).
- **Background:** `--card` (Branco no claro).
- **Shadow Strategy:** `shadow-sm` em repouso (ver Elevation). Sem cards aninhados.
- **Border:** 1px `--border`.
- **Internal Padding:** 24px (`p-6`); header e content compartilham o mesmo eixo.

### Inputs / Fields
- **Style:** altura 40px (`h-10`), borda `--input`, fundo `--background`, cantos 6px, padding `8px 12px`.
- **Focus:** anel de 2px `--ring` com offset (mesmo vocabulário do botão).
- **Placeholder:** Cinza de Legenda (`placeholder:text-muted-foreground`) — contraste AA, não cinza fantasma.
- **Disabled:** `cursor-not-allowed` + `opacity-50`.
- **Alvo de toque:** 40px atende o mínimo; em portaria/bar (touch), prefira `lg`/44px.

### Badges
- **Style:** pílula (`rounded-full`), `px-2.5 py-0.5`, `text-xs font-semibold`. Variantes default (azul), secondary, destructive, outline.

### Navigation
- **Style:** sidebar fixa de 256px (`w-64`), colapsável; item = ícone Lucide + rótulo, 8px de canto.
- **Estados:** ativo = `bg-primary` + `text-primary-foreground`; hover = fundo neutro (`hover:bg-gray-100`). Item de CRM pode carregar badge de notificação.
- **Mobile:** sidebar vira overlay com backdrop `bg-black/50`; header fixo com toggle.

### Signature: Carteirinha / QR
Componentes de acesso (validação por QR na portaria, carteirinha imprimível) têm regras de impressão dedicadas em `globals.css` (`@media print`, `.print-area`, `[data-no-print]`). Preserve-as: a impressão esconde sidebar/header e centra a área imprimível.

## 6. Do's and Don'ts

### Do:
- **Do** usar o Azul de Confiança (#2563EB) como única cor de ação — botão primário, item ativo, foco, seleção.
- **Do** manter Inter em escala `rem` fixa; hierarquia por peso e tamanho, não por família.
- **Do** manter superfícies planas em repouso; elevar só em resposta a estado.
- **Do** entregar todo componente com os sete estados (default, hover, focus-visible, active, disabled, loading, error).
- **Do** usar skeletons para carregamento de conteúdo, não spinner solto no meio da tela.
- **Do** escrever estados vazios que ensinam a tela ("Nenhum associado ainda — cadastre o primeiro"), não "Nada aqui".
- **Do** garantir contraste AA e alvos de toque ~44px na linha de frente (portaria, bar); parear estado com ícone/texto, nunca só cor.

### Don't:
- **Don't** parecer **sistema público legado**: cinza morto, tabelas sem respiro, sem hierarquia, sem estados de foco/hover.
- **Don't** parecer **template genérico** shadcn azul saído da caixa, sem sistema próprio.
- **Don't** dar a cada seção sua própria cor de marca (o âmbar do Bar, o verde do WhatsApp, o roxo do Admin no sidebar legado) — viola A Regra da Voz Única.
- **Don't** reintroduzir um segundo sidebar/vocabulário de navegação. A navegação canônica é a `<aside>` em `src/app/(dashboard)/layout.tsx` — mantenha uma só.
- **Don't** rebaixar corpo de texto para cinza-claro "por elegância" — quebra o contraste para usuários não-técnicos.
- **Don't** usar `clamp()` fluido em títulos de UI, `border-left` colorida como faixa, texto em gradiente, ou glassmorphism decorativo.
- **Don't** aninhar cards, inventar afordância para tarefa padrão, ou tratar modal como primeira opção — esgote alternativas inline/progressivas antes.
- **Don't** adicionar animação decorativa que não comunica estado; respeite `prefers-reduced-motion`.
