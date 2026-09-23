import {NextRequest} from 'next/server'
import {POST,GET} from '@/app/api/portaria/piscina/route'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {registrarPiscina} from '@/lib/portaria-piscina'
jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
jest.mock('@/lib/supabase/servico-auditado',()=>({servicoAuditado:jest.fn()}))
jest.mock('@/lib/portaria-piscina',()=>({registrarPiscina:jest.fn()}))
const run=(body:object,origin='https://sistema.test')=>POST(new NextRequest('https://sistema.test/api/portaria/piscina',{method:'POST',headers:{origin},body:JSON.stringify(body)}))
beforeEach(()=>{jest.clearAllMocks();process.env.NEXT_PUBLIC_SUPABASE_URL='https://sistema.test';(acessoRota as jest.Mock).mockResolvedValue(null)})
test('busca e historico exigem permissao especifica de piscina',async()=>{expect((await GET(new Request('https://sistema.test/api/portaria'))).status).toBe(403);expect((await run({acao:'buscar',valor:'QR'})).status).toBe(403);expect(acessoRota).toHaveBeenCalledWith('portaria_piscina');expect(servicoAuditado).not.toHaveBeenCalled()})
test('nao aceita exame_valido informado pelo navegador',async()=>{(acessoRota as jest.Mock).mockResolvedValue({user:{id:'op'}});expect((await run({acao:'registrar',associado_id:'12345678-1234-4234-8234-123456789abc',tipo:'entrada',exame_valido:true})).status).toBe(400);expect(registrarPiscina).not.toHaveBeenCalled()})
test('origem externa negada',async()=>{expect((await run({acao:'buscar',valor:'QR'},'https://outro.test')).status).toBe(403);expect(servicoAuditado).not.toHaveBeenCalled()})
