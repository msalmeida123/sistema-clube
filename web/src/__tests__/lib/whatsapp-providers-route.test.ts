import { POST } from '@/app/api/whatsapp/providers/route'
const single=jest.fn(),getSessionStatus=jest.fn(),createProvider=jest.fn((...args:any[])=>({getSessionStatus}))
const chain:any={select:jest.fn(()=>chain),eq:jest.fn(()=>chain),single,update:jest.fn(()=>chain)}
jest.mock('@supabase/auth-helpers-nextjs',()=>({createRouteHandlerClient:()=>({auth:{getUser:async()=>({data:{user:{id:'admin'}}})},from:()=>chain})}))
jest.mock('next/headers',()=>({cookies:jest.fn()}))
jest.mock('@/lib/whatsapp/factory',()=>({createProvider:(...args:any[])=>createProvider(...args)}))
const request=()=>new Request('http://localhost/api/whatsapp/providers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'test',id:'provider',tipo:'meta',meta_access_token:'****fake'})})
beforeEach(()=>{jest.clearAllMocks();getSessionStatus.mockResolvedValue({connected:true})})
it('testa com a credencial salva, não com o valor mascarado do formulário',async()=>{
 const saved={id:'provider',tipo:'meta',meta_access_token:'token-de-teste-salvo'};single.mockResolvedValue({data:saved,error:null});const response=await POST(request());expect(response.status).toBe(200);expect(createProvider).toHaveBeenCalledWith(saved);expect(JSON.stringify(await response.json())).not.toContain(saved.meta_access_token)
})
it('não consulta a Meta quando a conexão salva não está acessível',async()=>{single.mockResolvedValue({data:null,error:{code:'42501'}});expect((await POST(request())).status).toBe(404);expect(createProvider).not.toHaveBeenCalled()})
