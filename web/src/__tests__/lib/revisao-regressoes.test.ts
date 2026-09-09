import { verificarPermissao } from '@/lib/usuario-atual'

const mockDb: any = {}
const mockAuth: any = { auth: { getUser: jest.fn(), admin: { createUser: jest.fn() } }, from: jest.fn() }
jest.mock('@supabase/auth-helpers-nextjs', () => ({ createRouteHandlerClient: () => mockAuth }))
jest.mock('@supabase/supabase-js', () => ({ createClient: () => mockDb }))
jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('net', () => ({ __esModule: true, default: { Socket: jest.fn(() => { throw new Error('TCP não deve ser acessado') }) } }))

const emitir = require('@/app/api/bar/nfce/emitir/route').POST
const criarUsuario = require('@/app/api/usuarios/route').POST

beforeEach(() => {
  jest.clearAllMocks()
  for (const k of ['from', 'select', 'eq', 'limit', 'update']) mockDb[k] = jest.fn(() => mockDb)
  mockDb.maybeSingle = jest.fn()
  mockDb.single = jest.fn()
  mockDb.insert = jest.fn().mockResolvedValue({ error: null })
  mockDb.auth = mockAuth.auth
  mockAuth.from.mockImplementation(() => mockDb)
  mockAuth.auth.getUser.mockResolvedValue({ data: { user: { id: 'auth' } } })
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only'
})

test.each([true, false])('usuário inativo é negado, admin=%s', async (admin) => {
  mockDb.maybeSingle.mockResolvedValue({ data: { ativo: false, is_admin: admin, permissoes: ['bar'] } })
  expect(await verificarPermissao(mockDb, 'auth', 'bar')).toEqual({ autorizado: false, isAdmin: false })
})
test('operador ativo com bar é autorizado', async () => {
  mockDb.maybeSingle.mockResolvedValue({ data: { ativo: true, is_admin: false, permissoes: ['bar'] } })
  expect(await verificarPermissao(mockDb, 'auth', 'bar')).toEqual({ autorizado: true, isAdmin: false })
})
test('nota de outro pedido é rejeitada antes de reservar número ou usar TCP', async () => {
  mockDb.maybeSingle
    .mockResolvedValueOnce({ data: { ativo: true, is_admin: true } })
    .mockResolvedValueOnce({ data: { id: 'config', ativo: true } })
    .mockResolvedValueOnce({ data: null, error: null })
  mockDb.single.mockResolvedValue({ data: { status: 'pago' } })
  const response = await emitir(new Request('http://localhost/api/bar/nfce/emitir', { method: 'POST', body: JSON.stringify({ pedido_id: 'pedido', nfce_id: 'outra-nota' }) }))
  expect(response.status).toBe(400)
  expect(mockDb.eq).toHaveBeenCalledWith('pedido_id', 'pedido')
  expect(mockDb.update).not.toHaveBeenCalled()
})
test('cadastro preserva senha com espaços e caracteres HTML', async () => {
  mockDb.single.mockResolvedValue({ data: { is_admin: true } })
  mockAuth.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'novo' } }, error: null })
  const senha = '  Ab<Xy>  987!  '
  const response = await criarUsuario(new Request('http://localhost/api/usuarios', { method: 'POST', body: JSON.stringify({ nome: 'Operador', email: 'operador@example.com', senha }) }))
  expect(response.status).toBeLessThan(300)
  expect(mockAuth.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({ password: senha }))
})
test('cadastro rejeita senha não textual', async () => {
  mockDb.single.mockResolvedValue({ data: { is_admin: true } })
  const response = await criarUsuario(new Request('http://localhost/api/usuarios', { method: 'POST', body: JSON.stringify({ nome: 'Operador', email: 'operador@example.com', senha: 123456 }) }))
  expect(response.status).toBe(400)
  expect(mockAuth.auth.admin.createUser).not.toHaveBeenCalled()
})


const rotasBar = [
  ['comprovante', require('@/app/api/bar/comprovante/route').GET],
  ['emitir', emitir],
  ['status', require('@/app/api/bar/nfce/emitir/route').GET],
  ['cancelar', require('@/app/api/bar/nfce/cancelar/route').POST],
] as const

function requisicaoBar() {
  const url = 'http://localhost/api/bar/nfce/emitir?acao=status&pedido_id=pedido'
  return Object.assign(new Request(url), { nextUrl: new URL(url) })
}

test.each(rotasBar)('%s: sem sessão retorna 401 antes de consultar dados', async (_nome, handler) => {
  mockAuth.auth.getUser.mockResolvedValue({ data: { user: null } })
  const response = await handler(requisicaoBar())
  expect(response.status).toBe(401)
  expect(mockDb.from).not.toHaveBeenCalled()
})

test.each(rotasBar)('%s: admin inativo retorna 403', async (_nome, handler) => {
  mockDb.maybeSingle.mockResolvedValue({ data: { ativo: false, is_admin: true, permissoes: ['bar'] } })
  const response = await handler(requisicaoBar())
  expect(response.status).toBe(403)
  expect(mockDb.from.mock.calls.every(([tabela]: [string]) => tabela === 'usuarios')).toBe(true)
})

test.each(rotasBar)('%s: operador sem bar retorna 403', async (_nome, handler) => {
  mockDb.maybeSingle.mockResolvedValue({ data: { ativo: true, is_admin: false, permissoes: [] } })
  const response = await handler(requisicaoBar())
  expect(response.status).toBe(403)
})

test('cancelar: operador com bar também recebe 403', async () => {
  mockDb.maybeSingle.mockResolvedValue({ data: { ativo: true, is_admin: false, permissoes: ['bar'] } })
  const response = await require('@/app/api/bar/nfce/cancelar/route').POST(requisicaoBar())
  expect(response.status).toBe(403)
  expect(mockDb.update).not.toHaveBeenCalled()
})
