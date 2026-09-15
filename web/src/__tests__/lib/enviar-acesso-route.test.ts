import {NextRequest} from 'next/server'
import {POST} from '@/app/api/associados/[id]/enviar-acesso/route'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {buscarUsuarioAtual} from '@/lib/usuario-atual'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {enviarAcessoAssociado} from '@/lib/enviar-acesso-associado'
jest.mock('next/headers',()=>({cookies:jest.fn()}))
jest.mock('@/lib/supabase/route-client',()=>({createRouteHandlerClient:jest.fn()}))
jest.mock('@/lib/usuario-atual',()=>({buscarUsuarioAtual:jest.fn()}))
jest.mock('@/lib/supabase/servico-auditado',()=>({servicoAuditado:jest.fn()}))
jest.mock('@/lib/enviar-acesso-associado',()=>({enviarAcessoAssociado:jest.fn()}))
jest.mock('@/lib/associado-app',()=>({limite:jest.fn()}))
const getUser=jest.fn(),rpc=jest.fn();const params={id:'10000000-0000-4000-8000-000000000001'}
const request=(origin='https://sistema.test')=>new NextRequest('https://sistema.test/api/associados/'+params.id+'/enviar-acesso',{method:'POST',headers:{origin}})
beforeEach(()=>{jest.clearAllMocks();process.env.NEXT_PUBLIC_SUPABASE_URL='https://sistema.test/supabase';(createRouteHandlerClient as jest.Mock).mockReturnValue({auth:{getUser},rpc});getUser.mockResolvedValue({data:{user:{id:'operator'}}});(buscarUsuarioAtual as jest.Mock).mockResolvedValue({ativo:true,is_admin:false});rpc.mockResolvedValue({data:false})})
test('bloqueia origem externa antes de autenticar',async()=>{expect((await POST(request('https://evil.test'),{params:Promise.resolve(params)})).status).toBe(403);expect(getUser).not.toHaveBeenCalled()})
test('exige sessao autenticada',async()=>{getUser.mockResolvedValue({data:{user:null}});expect((await POST(request(),{params:Promise.resolve(params)})).status).toBe(401);expect(enviarAcessoAssociado).not.toHaveBeenCalled()})
test('permissao apenas visualizar nao autoriza envio',async()=>{expect((await POST(request(),{params:Promise.resolve(params)})).status).toBe(403);expect(rpc).toHaveBeenCalledWith('sistema_pode',{codigo:'associados',acao:'editar'});expect(servicoAuditado).not.toHaveBeenCalled()})
test('usuario inativo nao envia mesmo sendo admin',async()=>{(buscarUsuarioAtual as jest.Mock).mockResolvedValue({ativo:false,is_admin:true});expect((await POST(request(),{params:Promise.resolve(params)})).status).toBe(403);expect(enviarAcessoAssociado).not.toHaveBeenCalled()})
test('envio autorizado usa email retornado pelo banco',async()=>{
 rpc.mockResolvedValue({data:true});const a={id:params.id,email:'saved@example.test'};const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:a})})})})};(servicoAuditado as jest.Mock).mockReturnValue(db);
 const res=await POST(request(),{params:Promise.resolve(params)});expect(res.status).toBe(200);expect(enviarAcessoAssociado).toHaveBeenCalledWith(db,a);expect(await res.json()).not.toHaveProperty('password');
})
