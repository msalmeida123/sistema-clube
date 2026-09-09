import { gerarComandaCozinha } from '@/lib/comanda-cozinha'

const pedido = {
  numero_pedido: 42, mesa: '12', cliente_nome: 'Cliente teste',
  observacao: 'Pizza sem cebola', created_at: '2026-09-07T15:00:00Z',
  bar_itens_pedido: [
    { produto_nome: 'Pizza', quantidade: 2, enviar_cozinha: true },
    { produto_nome: 'Refrigerante', quantidade: 1, enviar_cozinha: false },
  ],
}

test('pedido misto imprime somente alimentos destinados à cozinha e identifica a mesa', () => {
  const html = gerarComandaCozinha(pedido)
  expect(html).toContain('2x')
  expect(html).toContain('Pizza')
  expect(html).not.toContain('Refrigerante')
  expect(html).toContain('Mesa: 12')
  expect(html).toContain('Cliente teste')
  expect(html).toContain('Pedido #42')
  expect(html).toContain('12:00:00')
  expect(html).toContain('Pizza sem cebola')
})

test('escapa campos livres, inclusive nome do produto', () => {
  const html = gerarComandaCozinha({ ...pedido, mesa: '<svg>', cliente_nome: '<script>alert(1)</script>', observacao: '<img src=x>', bar_itens_pedido: [{ produto_nome: '<b>Pizza</b>', quantidade: 1, enviar_cozinha: true }] })
  expect(html).not.toContain('<script>')
  expect(html).not.toContain('<img')
  expect(html).toContain('&lt;svg&gt;')
  expect(html).toContain('&lt;b&gt;Pizza&lt;&#x2F;b&gt;')
})

test('pedido de bebidas não gera comanda vazia', () => {
  expect(() => gerarComandaCozinha({ ...pedido, bar_itens_pedido: [pedido.bar_itens_pedido[1]] })).toThrow('não contém itens')
})

test('consumidor sem cadastro e balcão são permitidos', () => {
  const html = gerarComandaCozinha({ ...pedido, cliente_nome: '', mesa: '' })
  expect(html).toContain('Consumidor final')
  expect(html).toContain('Balcão')
})
