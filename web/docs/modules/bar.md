# Módulo: Bar

POS (ponto de venda) do bar/restaurante do clube, com carteirinha (pré-pago), controle de caixa e emissão de NFC-e via ACBrMonitor.

## Localização
`src/modules/bar/`

## Status
✅ Completo

## Entidades principais
### Catálogo
- `BarCategoria`, `BarCategoriaFormData`
- `BarProduto`, `BarProdutoFormData` — inclui campos fiscais (ncm, cst, cfop) e controle de estoque

### Pedido / Comanda
- `BarPedido` — status (`aberto | aguardando_pagamento | pago | cancelado`), itens, pagamentos, mesa
- `BarItemPedido`, `BarPagamento` (`FormasPagamentoBar`: dinheiro, cartao_credito, cartao_debito, pix, carteirinha, cortesia)
- `ItemCarrinho`, `CriarPedidoPayload`

### Carteirinha (saldo pré-pago do associado)
- `CarteirinhaSaldo`, `CarteirinhaMovimento` (`TipoMovimentoCarteirinha`: credito/debito)
- `RecargaCarteirinhaPayload`

### NFC-e (fiscal)
- `BarNFCe` — status (`pendente | autorizada | cancelada | rejeitada | contingencia`), chave de acesso, protocolo, QR Code, DANFE
- `BarConfigNFCe` / `BarConfigNFCeFormData` — configuração do emitente (CNPJ, endereço, CSC, ACBr URL, ambiente produção/homologação)

### Caixa
- `BarCaixa` — status (`aberto | fechado`), totais por forma de pagamento, sangrias/suprimentos, diferença
- `BarCaixaMovimento` (`TipoMovimentoCaixa`: sangria/suprimento)
- `AbrirCaixaPayload`, `FecharCaixaPayload`, `MovimentoCaixaPayload`

## Hooks
- `useBar` (e hooks relacionados exportados de `hooks/useBar`)

## Repository / Service
- `barService`
- `barCategoriasRepository`, `barProdutosRepository`, `barPedidosRepository`, `carteirinhaRepository`, `barNFCeRepository`, `barConfigNFCeRepository`, `barCaixaRepository`

## Integração externa
Emissão fiscal via **ACBrMonitor** (TCP), conforme `acbr_url` em `BarConfigNFCe`. Fila de retry `bar_nfce_fila` orquestrada em n8n com classificação de erros e alertas via Telegram.

## Uso
```tsx
import { useBarProdutos, useCarrinho } from '@/modules/bar'
```

## Relacionados
- `associados` (comanda vinculada a associado, saldo de carteirinha)
- `configuracoes` (dados fiscais do emitente podem repassar para `ConfiguracaoClube`)
