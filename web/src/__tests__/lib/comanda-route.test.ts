/** @jest-environment node */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/bar/comprovante/route'

const mockUser = jest.fn()
const mockPermissao = jest.fn()
const mockSingle = jest.fn()
const mockFrom = jest.fn(() => ({ select: () => ({ eq: () => ({ single: mockSingle }) }) }))
jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('@supabase/auth-helpers-nextjs', () => ({ createRouteHandlerClient: () => ({ auth: { getUser: mockUser } }) }))
jest.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: (...args: unknown[]) => mockFrom() }) }))
jest.mock('@/lib/usuario-atual', () => ({ verificarPermissao: (...args: unknown[]) => mockPermissao() }))

beforeEach(() => {
  jest.clearAllMocks()
  mockUser.mockResolvedValue({ data: { user: { id: 'operador' } } })
  mockPermissao.mockResolvedValue({ autorizado: true })
  mockSingle.mockResolvedValue({ data: { numero_pedido: 99, status: 'pago', mesa: '8', created_at: '2026-09-07T15:00:00Z', bar_itens_pedido: [{ enviar_cozinha: true, produto_nome: 'Lanche', quantidade: 1 }] } })
})
const request = () => new NextRequest('http://localhost/api/bar/comprovante?pedido_id=teste&via=cozinha')

test('cozinha exige login antes de consultar pedidos', async () => {
  mockUser.mockResolvedValue({ data: { user: null } })
  expect((await GET(request())).status).toBe(401)
  expect(mockFrom).not.toHaveBeenCalled()
})
test('cozinha exige permissão do bar', async () => {
  mockPermissao.mockResolvedValue({ autorizado: false })
  expect((await GET(request())).status).toBe(403)
  expect(mockFrom).not.toHaveBeenCalled()
})
test('retorna HTML da comanda autorizada', async () => {
  const response = await GET(request())
  expect(response.status).toBe(200)
  const html = await response.text()
  expect(html).toContain('Mesa: 8')
  expect(html).toContain('Lanche')
  expect(html).not.toContain('TOTAL')
})
test('bloqueia impressão de pedido cancelado', async () => {
  mockSingle.mockResolvedValue({ data: { status: 'cancelado' } })
  expect((await GET(request())).status).toBe(409)
})
