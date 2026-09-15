jest.mock('next/headers',()=>({cookies:jest.fn()}))
jest.mock('@supabase/auth-helpers-nextjs',()=>({createRouteHandlerClient:jest.fn()}))
jest.mock('@/lib/usuario-atual',()=>({buscarUsuarioAtual:jest.fn()}))
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs'
import {buscarUsuarioAtual} from '@/lib/usuario-atual'
import {acessoRota} from '@/lib/supabase/acesso-rota'
const getUser=jest.fn(),rpc=jest.fn()
beforeEach(()=>{jest.clearAllMocks();(createRouteHandlerClient as jest.Mock).mockReturnValue({auth:{getUser},rpc});getUser.mockResolvedValue({data:{user:{id:'u1'}},error:null});(buscarUsuarioAtual as jest.Mock).mockResolvedValue({ativo:true,is_admin:false});rpc.mockResolvedValue({data:true,error:null})})
test('valida autenticação apenas uma vez por requisição',async()=>{expect(await acessoRota('compras','criar')).toEqual({user:{id:'u1'},admin:false});expect(getUser).toHaveBeenCalledTimes(1);expect(rpc).toHaveBeenCalledWith('sistema_pode',{codigo:'compras',acao:'criar'})})
test('nega sessão inválida antes de consultar permissões',async()=>{getUser.mockResolvedValue({data:{user:null},error:{}});expect(await acessoRota()).toBeNull();expect(buscarUsuarioAtual).not.toHaveBeenCalled()})
test('nega usuário inativo mesmo administrador',async()=>{(buscarUsuarioAtual as jest.Mock).mockResolvedValue({ativo:false,is_admin:true});expect(await acessoRota('compras')).toBeNull();expect(rpc).not.toHaveBeenCalled()})
test('revogação tem efeito na requisição seguinte, sem cache',async()=>{expect(await acessoRota('compras')).not.toBeNull();rpc.mockResolvedValue({data:false,error:null});expect(await acessoRota('compras')).toBeNull();expect(getUser).toHaveBeenCalledTimes(2)})
test('falha na consulta de permissão nega acesso',async()=>{rpc.mockResolvedValue({data:true,error:{}});expect(await acessoRota('compras')).toBeNull()})
test('suporte identifica admin sem conceder privilégio a usuário comum',async()=>{expect((await acessoRota())?.admin).toBe(false);(buscarUsuarioAtual as jest.Mock).mockResolvedValue({ativo:true,is_admin:true});expect((await acessoRota())?.admin).toBe(true)})
