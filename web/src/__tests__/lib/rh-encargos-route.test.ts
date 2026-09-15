import {GET,PUT} from '@/app/api/rh/encargos/route'
import {ENCARGOS_2026} from '@/modules/rh/encargos'
const getUser=jest.fn(),permissao=jest.fn(),single=jest.fn(),maybeSingle=jest.fn()
const chain:any={select:jest.fn(()=>chain),eq:jest.fn(()=>chain),insert:jest.fn(()=>chain),update:jest.fn(()=>chain),single,maybeSingle}
const from=jest.fn(()=>chain)
jest.mock('@supabase/auth-helpers-nextjs',()=>({createRouteHandlerClient:()=>({auth:{getUser}})}))
jest.mock('next/headers',()=>({cookies:jest.fn()}))
jest.mock('@/lib/usuario-atual',()=>({verificarPermissao:(...args:any[])=>permissao(...args)}))
jest.mock('@/lib/supabase/servico-auditado',()=>({servicoAuditado:()=>({from})}))
const req=(body:any)=>new Request('http://localhost/api/rh/encargos',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}) as any
beforeEach(()=>{jest.clearAllMocks();getUser.mockResolvedValue({data:{user:{id:'admin'}}});permissao.mockResolvedValue({autorizado:true,isAdmin:true});single.mockResolvedValue({error:null});maybeSingle.mockResolvedValue({data:null,error:null})})
test('bloqueia anônimo e usuário sem RH',async()=>{getUser.mockResolvedValueOnce({data:{user:null}});expect((await GET()).status).toBe(403);permissao.mockResolvedValueOnce({autorizado:false,isAdmin:false});expect((await GET()).status).toBe(403);expect(from).not.toHaveBeenCalled()})
test('RH pode ler; somente admin pode alterar',async()=>{permissao.mockResolvedValue({autorizado:true,isAdmin:false});expect((await GET()).status).toBe(200);expect((await PUT(req({parametros:ENCARGOS_2026}))).status).toBe(403);expect(chain.insert).not.toHaveBeenCalled()})
test('rejeita tabela inválida e detecta edição concorrente',async()=>{expect((await PUT(req({parametros:{...ENCARGOS_2026,fgts:-8}}))).status).toBe(400);expect(chain.insert).not.toHaveBeenCalled();single.mockResolvedValue({error:{code:'PGRST116'}});expect((await PUT(req({parametros:ENCARGOS_2026,versao:'2026-09-08T00:00:00Z'}))).status).toBe(409)})
test('salva parâmetros validados com versão',async()=>{expect((await PUT(req({parametros:ENCARGOS_2026,versao:'2026-09-08T00:00:00Z'}))).status).toBe(200);expect(chain.eq).toHaveBeenCalledWith('updated_at','2026-09-08T00:00:00Z')})
