jest.mock('@/lib/gestao-licencas/servidor',()=>({
 donoGestao:jest.fn(),respostaGestao:(b:unknown,s=200)=>Response.json(b,{status:s}),
 erroGestao:(e:any)=>Response.json({error:e.message},{status:e.status||503}),
 ErroGestao:class extends Error{constructor(public status:number,message:string){super(message)}},
}))
import {NextRequest} from 'next/server'
import {POST} from '@/app/api/gestao-clientes/route'
import {donoGestao} from '@/lib/gestao-licencas/servidor'
const id='11111111-1111-4111-8111-111111111111'
const req=(extra:object={})=>new NextRequest('https://gestao.test/api/gestao-clientes',{method:'POST',headers:{origin:'https://gestao.test','Content-Type':'application/json'},body:JSON.stringify({acao:'deposito',id,operacao:'confirmar',dados:{conferido:true,valor_centavos:9900,data:'2026-01-01',referencia:'transacao-123'},...extra})})
const rpc=jest.fn()
beforeEach(()=>{jest.clearAllMocks();rpc.mockResolvedValue({error:null});(donoGestao as jest.Mock).mockResolvedValue({db:{rpc},cfg:{ambiente:'sandbox'},ator:{user:{id:'proprietario-autenticado'}}})})
test('usa ator da sessão e ambiente do servidor, nunca os enviados pelo navegador',async()=>{
 expect((await POST(req({ator:'fraudulento',ambiente:'production'}))).status).toBe(200)
 expect(rpc).toHaveBeenCalledWith('gestao_registrar_deposito',expect.objectContaining({p_ator:'proprietario-autenticado',p_ambiente:'sandbox',p_valor:9900}))
})
test('não confirma sem declaração explícita de conferência',async()=>{
 expect((await POST(req({dados:{conferido:false,valor_centavos:9900,data:'2026-01-01',referencia:'teste'}}))).status).toBe(400)
 expect(rpc).not.toHaveBeenCalled()
})
test('não acessa baixa manual quando proprietário não está autenticado',async()=>{
 (donoGestao as jest.Mock).mockRejectedValue({status:403,message:'Não autorizado'})
 expect((await POST(req())).status).toBe(403);expect(rpc).not.toHaveBeenCalled()
})
test('divergência de valor ou situação retorna conflito, não sucesso',async()=>{
 rpc.mockResolvedValue({error:{code:'P0001'}})
 expect((await POST(req())).status).toBe(409)
})
