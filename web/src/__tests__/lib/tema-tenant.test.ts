import {NextRequest} from 'next/server'
import {atorTema,clubeTema} from '@/lib/tema/servidor'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {buscarUsuarioAtual} from '@/lib/usuario-atual'
import {appDb,sessaoAssociado} from '@/lib/associado-app'
jest.mock('next/headers',()=>({cookies:jest.fn()}))
jest.mock('@/lib/supabase/route-client',()=>({createRouteHandlerClient:jest.fn()}))
jest.mock('@/lib/usuario-atual',()=>({buscarUsuarioAtual:jest.fn()}))
jest.mock('@/lib/associado-app',()=>({appDb:jest.fn(),sessaoAssociado:jest.fn()}))
const maybeSingle=jest.fn(),eq=jest.fn(),getUser=jest.fn()
beforeEach(()=>{jest.clearAllMocks();eq.mockReturnValue({maybeSingle});maybeSingle.mockResolvedValue({data:{clube_id:'clube-A'},error:null});(appDb as jest.Mock).mockReturnValue({from:()=>({select:()=>({eq})})});getUser.mockResolvedValue({data:{user:null},error:null});(createRouteHandlerClient as jest.Mock).mockResolvedValue({auth:{getUser}});(buscarUsuarioAtual as jest.Mock).mockResolvedValue({clube_id:'clube-A',ativo:true,is_admin:true})})
const req=(url='https://clube.test/api/tema?clube_id=clube-B',cookie='')=>new NextRequest(url,{headers:{host:new URL(url).host,cookie}})
test('antes do login usa apenas domínio cadastrado, ignora identificador do cliente',async()=>{expect(await clubeTema(req())).toBe('clube-A');expect(eq).toHaveBeenCalledWith('dominio','clube.test')})
test('host desconhecido falha fechado',async()=>{maybeSingle.mockResolvedValue({data:null,error:null});await expect(clubeTema(req())).rejects.toMatchObject({status:404})})
test('sessão administrativa de outro clube é negada',async()=>{getUser.mockResolvedValue({data:{user:{id:'auth-B'}}});(buscarUsuarioAtual as jest.Mock).mockResolvedValue({clube_id:'clube-B',ativo:true});await expect(clubeTema(req())).rejects.toMatchObject({status:403})})
test('sessão de associado de outro clube é negada',async()=>{(sessaoAssociado as jest.Mock).mockResolvedValue({associado:{clube_id:'clube-B'}});await expect(clubeTema(req(undefined,'clube_associado=token'))).rejects.toMatchObject({status:403})})
test('novo login deriva novamente o clube e exige administrador ativo',async()=>{getUser.mockResolvedValue({data:{user:{id:'auth-A'}},error:null});expect(await atorTema()).toMatchObject({clube:'clube-A'});(buscarUsuarioAtual as jest.Mock).mockResolvedValue({clube_id:'clube-B',ativo:true,is_admin:true});getUser.mockResolvedValue({data:{user:{id:'auth-B'}},error:null});expect(await atorTema()).toMatchObject({clube:'clube-B'});for(const u of [{clube_id:'clube-A',ativo:false,is_admin:true},{clube_id:'clube-A',ativo:true,is_admin:false},{ativo:true,is_admin:true}]){(buscarUsuarioAtual as jest.Mock).mockResolvedValue(u);await expect(atorTema()).rejects.toMatchObject({status:403})}})
