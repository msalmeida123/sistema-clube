jest.mock('@/lib/associado-app',()=>({appDb:jest.fn()}))
jest.mock('@/lib/gestao-licencas/servidor',()=>({
 configGestao:jest.fn(),hashChave:(s:string)=>'hash:'+s,
 respostaGestao:(body:unknown,status=200)=>Response.json(body,{status}),erroGestao:()=>Response.json({error:'Indisponível'},{status:503}),
}))
import {NextRequest} from 'next/server'
import {POST} from '@/app/api/licencas/validar/route'
import {configGestao} from '@/lib/gestao-licencas/servidor'
import {appDb} from '@/lib/associado-app'
const instalacao='11111111-1111-4111-8111-111111111111'
const req=(ambiente='production',token='CLUBE_'+'a'.repeat(43))=>new NextRequest('https://gestao.test/api/licencas/validar',{method:'POST',headers:{authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({instalacao,ambiente,dominio:'clube.example.com'})})
beforeEach(()=>{jest.clearAllMocks();(configGestao as jest.Mock).mockResolvedValue({ambiente:'production'})})
function banco(cliente:any,periodos:any[]=[]){
 const eq=jest.fn().mockReturnThis()
 const consulta={select:jest.fn().mockReturnThis(),eq,maybeSingle:jest.fn().mockResolvedValue({data:cliente,error:null}),lte:jest.fn().mockReturnThis(),gt:jest.fn().mockReturnThis(),order:jest.fn().mockReturnThis(),limit:jest.fn().mockResolvedValue({data:periodos,error:null})}
 ;(appDb as jest.Mock).mockReturnValue({from:jest.fn().mockReturnValue(consulta)})
 return consulta
}
test('rejeita chave inválida sem consultar banco',async()=>{expect((await POST(req('production','invalida'))).status).toBe(401);expect(appDb).not.toHaveBeenCalled()})
test('não cruza sandbox e produção',async()=>{expect((await POST(req('sandbox'))).status).toBe(403);expect(appDb).not.toHaveBeenCalled()})
test('licença deve pertencer à instalação, ao domínio e à chave',async()=>{const q=banco(null);expect((await POST(req())).status).toBe(401);expect(q.eq).toHaveBeenCalledWith('instalacao',instalacao);expect(q.eq).toHaveBeenCalledWith('dominio','clube.example.com');expect(q.eq).toHaveBeenCalledWith('chave_hash','hash:CLUBE_'+'a'.repeat(43));expect(q.eq).toHaveBeenCalledWith('ambiente','production')})
test('cliente suspenso é bloqueado mesmo com plano pago',async()=>{const q=banco({id:'c1',bloqueado:true});expect((await POST(req())).status).toBe(403);expect(q.limit).not.toHaveBeenCalled()})
test('cadastro sem pagamento não ativa',async()=>{banco({id:'c1',bloqueado:false});expect((await POST(req())).status).toBe(402)})
test('pagamento válido libera sem expor dados de cobrança ou chave',async()=>{banco({id:'c1',bloqueado:false},[{status:'RECEIVED',inicio:'2020-01-01',fim:'2099-01-01'}]);const r=await POST(req());expect(r.status).toBe(200);expect(await r.json()).toEqual({ativo:true,ambiente:'production',vencimento:'2099-01-01',motivo:'ativa'})})
test('instalação não paga ou estornada bloqueia até mesmo com mensalidade vigente',async()=>{
 const c={id:'c1',bloqueado:false,instalacao_centavos:9900}
 const q=banco(c,[{status:'RECEIVED',inicio:'2020-01-01',fim:'2099-01-01'}])
 q.maybeSingle.mockResolvedValueOnce({data:c,error:null}).mockResolvedValueOnce({data:null,error:null})
 const r=await POST(req());expect(r.status).toBe(402);expect((await r.json()).motivo).toBe('aguardando_instalacao');expect(q.limit).not.toHaveBeenCalled()
})
test('instalação paga libera o período inicial sem mensalidade',async()=>{
 const c={id:'c1',bloqueado:false,instalacao_centavos:9900}
 const q=banco(c,[{status:'RECEIVED',inicio:'2020-01-01',fim:'2099-01-01'}])
 q.maybeSingle.mockResolvedValueOnce({data:c,error:null}).mockResolvedValueOnce({data:{id:'inst'},error:null})
 expect((await POST(req())).status).toBe(200);expect(q.eq).toHaveBeenCalledWith('tipo','instalacao')
})
