import {NextRequest} from 'next/server'
import {POST} from '@/app/api/convites/atendimento/route'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {verificarPermissao} from '@/lib/usuario-atual'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
jest.mock('@/lib/supabase/route-client',()=>({createRouteHandlerClient:jest.fn()}))
jest.mock('@/lib/usuario-atual',()=>({verificarPermissao:jest.fn()}))
jest.mock('@/lib/supabase/servico-auditado',()=>({servicoAuditado:jest.fn()}))
const rpc=jest.fn();let permissao='portaria'
const run=(acao:string)=>POST(new NextRequest('https://sistema.test/api/convites/atendimento',{method:'POST',headers:{origin:'https://sistema.test'},body:JSON.stringify({qr:'CONV-123',acao,requisicao:'12345678-1234-4234-8234-123456789abc',resultado:'apto',medico:'Teste',crm:'SP123'})}))
beforeEach(()=>{jest.clearAllMocks();process.env.NEXT_PUBLIC_SUPABASE_URL='https://sistema.test';permissao='portaria';(createRouteHandlerClient as jest.Mock).mockResolvedValue({auth:{getUser:async()=>({data:{user:{id:'op'}}})}});(verificarPermissao as jest.Mock).mockImplementation(async(_a:any,_u:any,c:string)=>({autorizado:c===permissao}));rpc.mockResolvedValue({data:{ok:true},error:null});(servicoAuditado as jest.Mock).mockReturnValue({rpc})})
test('porteiro do clube registra entrada sem gestao de convites',async()=>{expect((await run('clube_entrada')).status).toBe(200);expect(rpc).toHaveBeenCalled()})
test('porteiro do clube nao libera piscina nem exame',async()=>{expect((await run('piscina_entrada')).status).toBe(403);expect((await run('exame')).status).toBe(403);expect(rpc).not.toHaveBeenCalled()})
test('porteiro piscina consulta e registra somente piscina',async()=>{permissao='portaria_piscina';expect((await run('consultar')).status).toBe(200);expect((await run('piscina_entrada')).status).toBe(200);expect((await run('piscina_saida')).status).toBe(200);expect((await run('clube_entrada')).status).toBe(403)})
test('exames pode consultar e examinar mas nao registrar entrada',async()=>{permissao='exames';expect((await run('exame')).status).toBe(200);expect((await run('consultar')).status).toBe(200);expect((await run('clube_entrada')).status).toBe(403)})
test('gestao de convites sozinha nao da acesso a portarias',async()=>{permissao='convites';expect((await run('clube_entrada')).status).toBe(403);expect(rpc).not.toHaveBeenCalled()})
test('sem sessao nao chama banco privilegiado',async()=>{(createRouteHandlerClient as jest.Mock).mockResolvedValue({auth:{getUser:async()=>({data:{user:null}})}});expect((await run('clube_entrada')).status).toBe(401);expect(rpc).not.toHaveBeenCalled()})
