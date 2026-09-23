jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
jest.mock('@/lib/associado-app',()=>({appDb:jest.fn()}))
jest.mock('@/lib/asaas-sandbox',()=>({configuracaoSandbox:jest.fn()}))
import {NextRequest} from 'next/server'
import {GET} from '../app/api/portaria/pix-sandbox/route'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {appDb} from '@/lib/associado-app'
const req=(q:string)=>new NextRequest('https://sistema.test/api/portaria/pix-sandbox?'+q)
beforeEach(()=>jest.clearAllMocks())
test('recusa usuário sem sessão',async()=>{(acessoRota as jest.Mock).mockResolvedValue(null);expect((await GET(req('setor=clube'))).status).toBe(403);expect(appDb).not.toHaveBeenCalled()})
test('recusa funcionário sem perfil administrador',async()=>{(acessoRota as jest.Mock).mockResolvedValue({admin:false});expect((await GET(req('setor=clube'))).status).toBe(403)})
test('recusa setor arbitrário',async()=>{(acessoRota as jest.Mock).mockResolvedValue({admin:true});expect((await GET(req('setor=outro'))).status).toBe(400)})
test('consulta somente referência de homologação do setor',async()=>{
 (acessoRota as jest.Mock).mockResolvedValue({admin:true})
 const eq=jest.fn().mockReturnValue({maybeSingle:async()=>({data:{id:'pay_test',valor:5,status:'RECEIVED'},error:null})})
 const from=jest.fn().mockReturnValue({select:()=>({eq})});(appDb as jest.Mock).mockReturnValue({from})
 const r=await GET(req('setor=academia&status=1'))
 expect(r.status).toBe(200);expect((await r.json()).status).toBe('RECEIVED')
 expect(from).toHaveBeenCalledWith('asaas_sandbox_cobrancas')
 expect(eq).toHaveBeenCalledWith('referencia','clube-homologacao-academia-5reais-v1')
})
