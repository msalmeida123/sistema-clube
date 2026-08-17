# Documentação dos Módulos — sistema-clube

Documentação individual de cada um dos 14 módulos do sistema, seguindo a arquitetura SRP
(`types → repositories → services → hooks → components`) descrita em `src/modules/README.md`.

## Índice

| Módulo | Descrição | Status |
|---|---|---|
| [associados](./associados.md) | Cadastro de sócios do clube | ✅ Completo |
| [auth](./auth.md) | Autenticação e permissões CRUD por página/perfil | ✅ Completo |
| [bar](./bar.md) | POS do bar, carteirinha, caixa e NFC-e | ✅ Completo |
| [compras](./compras.md) | Compras e fornecedores | ⚠️ Sem UI própria |
| [configuracoes](./configuracoes.md) | Configurações do clube, planos, quiosques, integrações | ⚠️ Sem UI própria |
| [crm](./crm.md) | CRM / WhatsApp (contatos, mensagens, bot, campanhas) | ⚠️ Sem UI própria |
| [dependentes](./dependentes.md) | Dependentes vinculados a associados | ⚠️ Sem UI própria |
| [eleicoes](./eleicoes.md) | Eleições internas (diretoria/conselho) | ⚠️ Sem UI própria |
| [exames](./exames.md) | Exames médicos de associados/dependentes | ⚠️ Sem UI própria |
| [financeiro](./financeiro.md) | Mensalidades, carnês e lançamentos | ✅ Completo |
| [infracoes](./infracoes.md) | Infrações disciplinares e julgamento | ⚠️ Sem UI própria |
| [portaria](./portaria.md) | Controle de acesso via QR Code | ✅ Completo |
| [rh](./rh.md) | Funcionários, ponto, folha e afastamentos | ✅ Completo |
| [shared](./shared.md) | Utilitários e hooks transversais | ✅ Completo |

## Mapa de relacionamentos (visão geral)

```
auth ──────────► (checa permissão de acesso a todos os módulos)
associados ─┬──► dependentes
            ├──► financeiro (mensalidades)
            ├──► portaria (validação de acesso)
            ├──► exames (validade p/ academia/piscina)
            ├──► infracoes (penalidades)
            ├──► eleicoes (votação)
            └──► crm (contato vinculado a sócio) / bar (comanda + carteirinha)
configuracoes ──► financeiro (valores padrão) / bar (dados fiscais) / crm (WaSender)
rh ─────────────► independente (funcionários ≠ associados)
compras ────────► financeiro (contas a pagar)
shared ─────────► usado por todos os módulos (formatação/validação)
```

## Sistema externo relacionado
O módulo `crm` do monólito coexiste com o **microserviço `crm-service`**
(repo `sistema-clube-microservices`), que expõe `/api/crm/*` e `/api/wasender/*`
via Traefik em produção e integra de fato com a API do WaSender para envio/recebimento
de mensagens do WhatsApp.
