jest.mock('@/lib/gestao-licencas/servidor',()=>({
 donoGestao:jest.fn(),configGestao:jest.fn(),asaasGestao:jest.fn(),
 respostaGestao:(b:unknown,s=200)=>Response.json(b,{status:s}),erroGestao:(e:any)=>Response.json({error:e.message},{status:e.status||503}),
 ErroGestao:class extends Error{constructor(public status:number,message:string){super(message)}},
}))
jest.mock('@/lib/gestao-licencas/credenciais',()=>({...jest.requireActual('@/lib/gestao-licencas/credenciais'),chaveMestra:jest.fn().mockResolvedValue(Buffer.alloc(32,1))}))
import {NextRequest} from 'next/server'
import {GET,POST} from '@/app/api/gestao-clientes/configuracoes/route'
import {donoGestao,configGestao,asaasGestao} from '@/lib/gestao-licencas/servidor'
import {decifrarCredencial} from '@/lib/gestao-licencas/credenciais'
const rpc=jest.fn(),select=jest.fn().mockReturnThis(),chave='chave-sandbox-ficticia-123456789'
const req=(body:any)=>new NextRequest('https://gestao.test/api/gestao-clientes/configuracoes',{method:'POST',headers:{origin:'https://gestao.test'},body:JSON.stringify(body)})
beforeEach(()=>{
 jest.clearAllMocks();rpc.mockResolvedValue({error:null});(asaasGestao as jest.Mock).mockResolvedValue({data:[]})
 const cfg={ambiente:'sandbox',apiKey:'antiga-nao-exibir',url:'https://gestao.test'}
 ;(configGestao as jest.Mock).mockResolvedValue(cfg)
 ;(donoGestao as jest.Mock).mockResolvedValue({cfg,ator:{user:{id:'proprietario'}},db:{rpc,from:()=>({select,eq:jest.fn().mockReturnThis(),maybeSingle:async()=>({data:{atualizado_em:'2026-09-20T12:00:00Z'},error:null})})}})
})
test('GET revela somente metadados, não chave nem criptograma',async()=>{
 const r=await GET(),b=await r.text()
 expect(r.status).toBe(200);expect(select).toHaveBeenCalledWith('atualizado_em');expect(b).not.toContain('antiga-nao-exibir');expect(b).not.toContain('api_key');expect(b).toContain('sandbox')
})
test('valida antes de salvar e retorna somente sucesso',async()=>{
 const r=await POST(req({acao:'salvar',ambiente:'sandbox',chave}));expect(r.status).toBe(200)
 expect(asaasGestao).toHaveBeenCalledWith(expect.objectContaining({apiKey:chave}),'/webhooks?limit=1')
 const p=rpc.mock.calls[0][1];expect(p.p_ator).toBe('proprietario');expect(p.p_cifrada).not.toContain(chave)
 expect(decifrarCredencial(p.p_cifrada,'sandbox',Buffer.alloc(32,1))).toBe(chave)
 expect(await r.text()).not.toContain(chave)
 expect(donoGestao).toHaveBeenCalledWith(expect.anything(),true)
})
test('chave recusada não substitui configuração existente',async()=>{
 (asaasGestao as jest.Mock).mockRejectedValue({status:409,message:'Chave inválida'})
 expect((await POST(req({acao:'salvar',ambiente:'sandbox',chave}))).status).toBe(409);expect(rpc).not.toHaveBeenCalled()
})
test('não permite trocar para produção pela requisição',async()=>{
 expect((await POST(req({acao:'salvar',ambiente:'production',chave}))).status).toBe(409);expect(asaasGestao).not.toHaveBeenCalled();expect(rpc).not.toHaveBeenCalled()
})
test('usuário sem autorização não lê nem salva configuração',async()=>{
 (donoGestao as jest.Mock).mockRejectedValue({status:403,message:'Não autorizado'})
 expect((await GET()).status).toBe(403);expect((await POST(req({acao:'salvar',ambiente:'sandbox',chave}))).status).toBe(403);expect(rpc).not.toHaveBeenCalled()
})
test('testar conexão não altera dados nem emite cobranças',async()=>{
 expect((await POST(req({acao:'testar'}))).status).toBe(200);expect(asaasGestao).toHaveBeenCalledWith(expect.anything(),'/webhooks?limit=1');expect(rpc).not.toHaveBeenCalled()
})
