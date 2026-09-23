jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
jest.mock('@/lib/associado-app',()=>({appDb:jest.fn()}))
import {asaasGestao,erroGestao} from '@/lib/gestao-licencas/servidor'
afterEach(()=>jest.restoreAllMocks())
test.each([401,403])('credencial rejeitada %s produz mensagem clara sem expor segredo',async status=>{
 jest.spyOn(global,'fetch').mockResolvedValue(new Response('segredo-nao-publicavel',{status}))
 let erro:unknown;try{await asaasGestao({ambiente:'sandbox',apiKey:'chave-privada'} as any,'/payments?limit=1')}catch(e){erro=e}
 const r=erroGestao(erro),body=await r.text()
 expect(r.status).toBe(409);expect(body).toContain('chave de API de Sandbox');expect(body).not.toContain('chave-privada');expect(body).not.toContain('segredo-nao-publicavel')
})
test('falha da dependência não vira erro genérico de gateway',async()=>{
 jest.spyOn(global,'fetch').mockResolvedValue(new Response('upstream',{status:500}))
 await expect(asaasGestao({ambiente:'sandbox',apiKey:'teste'} as any,'/payments')).rejects.toMatchObject({status:424,rejeitada:false})
})
