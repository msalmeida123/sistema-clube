# Product

## Register

product

## Users

Equipe operacional de um clube recreativo/social, atuando em papéis distintos e com níveis de familiaridade técnica variados:

- **Gestão** (admin, presidente, vice-presidente, diretor): visão ampla, relatórios, configuração, decisões.
- **Administrativo** (secretaria, financeiro): cadastro de associados/dependentes, mensalidades, carnês, compras, exames, infrações, eleições.
- **Operação de linha de frente** (portaria clube/piscina/academia/sauna, bar): tarefas rápidas e repetitivas — validação de acesso por QR, PDV, caixa — muitas vezes de pé, sob pressão de fila, com pouca tolerância a fricção.
- **Atendimento** (CRM WhatsApp): conversas, kanban, respostas automáticas, bot IA.

Contexto de uso: desktop na maior parte das telas administrativas; portaria e bar frequentemente em telas menores ou touch. Uso diário e prolongado — a interface é ferramenta de trabalho, não vitrine.

## Product Purpose

Sistema Clube é o sistema de gestão único do clube: centraliza associados e dependentes, financeiro (mensalidades, carnês, compras), controle de acesso (portaria por setor com QR/carteirinha), atendimento (CRM WhatsApp com bot), RH, eleições, exames médicos, infrações, bar/PDV e relatórios.

Sucesso = a equipe conclui cada tarefa operacional com o mínimo de fricção e de erro, confia nos dados que vê, e consegue treinar novos funcionários rapidamente porque as telas se comportam de forma previsível.

## Brand Personality

**Confiável e eficiente.** Sóbrio, direto, sem distrações. A interface deve transmitir seriedade de uma ferramenta de gestão em que se confia para dinheiro, acesso e dados de pessoas — priorizando velocidade operacional e clareza sobre estímulo visual.

- Voz: objetiva, em português claro, sem jargão.
- A ferramenta desaparece na tarefa; o brilho é reservado para momentos (confirmações, feedback de estado), não para páginas.

## Anti-references

- **Sistema "gov/legado".** Não pode parecer sistema público antigo: cinza morto, densidade sem hierarquia, tabelas pesadas sem respiro, ausência de estados de foco/hover. Densidade quando a tarefa pede — nunca sopa de dados.
- **Template genérico.** Não pode parecer o tema azul padrão do shadcn saído da caixa, indistinguível de qualquer boilerplate. Precisa de um sistema visual próprio e coerente, ainda que sóbrio.
- Corolário (do estado atual do código): evitar cores ad-hoc por seção (verde/âmbar/roxo/vermelho soltos no sidebar) e componentes divergentes entre telas — isso puxa para o polo "amador/festivo demais".

## Design Principles

1. **Consistência antes de novidade.** Um único vocabulário visual — mesmo botão, mesmo controle de formulário, mesmo estilo de ícone, mesmos estados — em todas as telas. Duas formas de fazer a mesma coisa significa que uma está errada. (Prioridade #1 declarada.)
2. **A ferramenta desaparece na tarefa.** Cada tela otimiza a tarefa primária daquele papel; nada de afordância inventada para tarefa padrão, nada de decoração que não comunique estado.
3. **Confiança pela previsibilidade.** Comportamento previsível tela a tela reduz erro e tempo de treino. Estados de carregamento, vazio e erro são parte do design, não sobras.
4. **Densidade proposital.** Mostrar muita informação quando o papel precisa (financeiro, relatórios), simplificar quando o papel é de linha de frente (portaria, bar). A densidade responde à tarefa, não ao acaso.
5. **Clareza para quem não é técnico.** Rótulos explícitos, hierarquia visual forte e caminhos óbvios — porteiros e secretaria não deveriam precisar de manual.

## Accessibility & Inclusion

- **Meta: WCAG 2.1 AA**, com atenção extra a usuários não-técnicos e possível baixa visão na linha de frente.
- Contraste AA para corpo de texto (≥4.5:1) e texto grande (≥3:1); não depender de cinza-claro "por elegância".
- Foco de teclado sempre visível; ordem de tabulação coerente em formulários longos.
- Alvos de toque adequados (portaria/bar em touch): mínimo ~44px.
- Respeitar `prefers-reduced-motion`; nenhuma animação essencial ao entendimento.
- Não comunicar estado apenas por cor (validação de acesso, status de pagamento) — parear com ícone/texto.
- Texto e rótulos generosos onde a linha de frente atua; evitar micro-tipografia em telas de tarefa rápida.
