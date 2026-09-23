import {NextRequest} from 'next/server'
import {endpointMensagens} from '@/lib/mensagens-clube'
import {endpointPushPermitido,inscricaoSchema} from '@/lib/push-clube'
import {sessaoAssociado,appDb,limite} from '@/lib/associado-app'
import {acessoRota} from '@/lib/supabase/acesso-rota'
jest.mock('@/lib/associado-app',()=>({sessaoAssociado:jest.fn(),appDb:jest.fn(),limite:jest.fn()}))
jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
const a='10000000-0000-4000-8000-000000000001',b='10000000-0000-4000-8000-000000000002',id='10000000-0000-4000-8000-000000000003'
function request(method:string,body?:any,query='',origin='https://app.test'){return new NextRequest('https://app.test/api/associado-app/mensagens'+query,{method,headers:{origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})}
let db:any,q:any
beforeEach(()=>{jest.clearAllMocks();q={select:jest.fn().mockReturnThis(),eq:jest.fn().mockReturnThis(),neq:jest.fn().mockReturnThis(),in:jest.fn().mockReturnThis(),order:jest.fn().mockReturnThis(),range:jest.fn().mockResolvedValue({data:[]}),maybeSingle:jest.fn().mockResolvedValue({data:{id:a,nome:'Associado'}}),insert:jest.fn().mockResolvedValue({}),upsert:jest.fn().mockResolvedValue({}),then:(resolve:any)=>resolve({data:[{id}]})};db={from:jest.fn(()=>q),rpc:jest.fn().mockResolvedValue({data:0})};(sessaoAssociado as jest.Mock).mockResolvedValue({associado:{id:a},db,tokenHash:'hash'});(appDb as jest.Mock).mockReturnValue(db);(acessoRota as jest.Mock).mockResolvedValue({user:{id:b}})})
test('recusa mensagem sem sessão',async()=>{(sessaoAssociado as jest.Mock).mockResolvedValue(null);expect((await endpointMensagens(request('POST',{id,texto:'Olá'}),'associado')).status).toBe(401);expect(db.from).not.toHaveBeenCalled()})
test('recusa origem externa antes de gravar',async()=>{expect((await endpointMensagens(request('POST',{id,texto:'Olá'},'','https://outro.test'),'associado')).status).toBe(403);expect(db.from).not.toHaveBeenCalled()})
test('associado não escolhe outra conversa',async()=>{expect((await endpointMensagens(request('POST',{id,texto:'Olá',associado_id:b}),'associado')).status).toBe(403);expect(q.insert).not.toHaveBeenCalled()})
test('consulta usa identidade da sessão mesmo com outro id na URL',async()=>{const r=await endpointMensagens(request('GET',undefined,'?associado_id='+b),'associado');expect(r.status).toBe(200);expect(q.eq).toHaveBeenCalledWith('associado_id',a);expect(q.eq).not.toHaveBeenCalledWith('associado_id',b);expect(r.headers.get('Cache-Control')).toBe('no-store');expect(q.range).toHaveBeenCalledWith(0,30)})
test('mensagem persiste remetente derivado da sessão',async()=>{q.maybeSingle.mockResolvedValue({data:null});expect((await endpointMensagens(request('POST',{id,texto:'Olá'}),'associado')).status).toBe(201);expect(q.insert).toHaveBeenCalledWith({id,associado_id:a,remetente_id:a,remetente_tipo:'associado',texto:'Olá'})})
test('leitura filtra conversa e grava somente leitor autenticado',async()=>{await endpointMensagens(request('PATCH',{ids:[id]}),'associado');expect(q.eq).toHaveBeenCalledWith('associado_id',a);expect(q.upsert.mock.calls[0][0]).toEqual([{mensagem_id:id,leitor_tipo:'associado',leitor_id:a}])})
test('envio da equipe exige editar e leitura exige visualizar',async()=>{await endpointMensagens(request('POST',{id,texto:'Olá',associado_id:a}),'equipe');expect(acessoRota).toHaveBeenLastCalledWith('associados','editar');await endpointMensagens(request('GET',undefined,'?resumo=1'),'equipe');expect(acessoRota).toHaveBeenLastCalledWith('associados','visualizar')})
test('destinos push rejeitam rede interna e imitações de provedores',()=>{for(const u of ['http://fcm.googleapis.com/a','https://127.0.0.1/a','https://fcm.googleapis.com.evil.test/a','https://user@fcm.googleapis.com/a','https://fcm.googleapis.com:8443/a'])expect(endpointPushPermitido(u)).toBe(false);expect(endpointPushPermitido('https://fcm.googleapis.com/test')).toBe(true);expect(inscricaoSchema.safeParse({endpoint:'https://fcm.googleapis.com/test',keys:{p256dh:'curta',auth:'curta'}}).success).toBe(false)})

jest.mock('web-push',()=>({sendNotification:jest.fn()}))
const webpush=require('web-push'),iniciarPush=require('../../../workers/notificacoes.cjs')
async function executarWorker({permitido=true,erro=0,tentativas=1}:{permitido?:boolean;erro?:number;tentativas?:number}={}){
 const updates:any[]=[];let apagou=false
 const banco={rpc:jest.fn(async(n:string)=>({data:n==='clube_push_reservar'?[{id:1,inscricao_id:'sub',lease:'lease',tentativas}]:permitido})),from:(t:string)=>{
  let valor:any={};const c:any={select:()=>c,eq:()=>c,single:async()=>({data:{public_key:'public',private_key:'private'}}),maybeSingle:async()=>({data:{endpoint:'https://fcm.googleapis.com/test',dono_tipo:'equipe',dono_id:b}}),update:(v:any)=>{valor=v;return c},delete:()=>{apagou=true;return c},then:(r:any)=>{if(t==='clube_push_fila')updates.push(valor);r({})}};return c
 }}
 if(erro)webpush.sendNotification.mockRejectedValue({statusCode:erro});else webpush.sendNotification.mockResolvedValue({})
 const stop=iniciarPush(banco);await new Promise(r=>setImmediate(r));await stop();return {updates,apagou}
}
test('worker não envia a usuário sem permissão',async()=>{const r=await executarWorker({permitido:false});expect(webpush.sendNotification).not.toHaveBeenCalled();expect(r.updates[0].resultado).toBe('inativo')})
test('push não inclui texto, nome ou documento',async()=>{await executarWorker();expect(JSON.parse(webpush.sendNotification.mock.calls[0][1])).toEqual({tipo:'equipe'})})
test('falha temporária agenda nova tentativa, endpoint expirado é removido',async()=>{const r=await executarWorker({erro:503});expect(r.updates[0].resultado).toBe('tentar_novamente');expect(r.updates[0].concluido_em).toBeNull();expect((await executarWorker({erro:410})).apagou).toBe(true)})
test('tentativas são limitadas',async()=>{const r=await executarWorker({erro:503,tentativas:6});expect(r.updates[0].resultado).toBe('falhou');expect(r.updates[0].concluido_em).toBeTruthy()})
test('origem pública pelo proxy exige Host correspondente',async()=>{
 const {origemMensagem}=await import('@/lib/mensagens-clube')
 expect(origemMensagem(new NextRequest('http://interno:3000/api/associados/mensagens',{headers:{host:'sistema.intellia.ia.br',origin:'https://sistema.intellia.ia.br'}}))).toBe(true)
 expect(origemMensagem(new NextRequest('http://interno:3000/api/associados/mensagens',{headers:{host:'sistema.intellia.ia.br',origin:'https://app.intellia.ia.br'}}))).toBe(false)
})

test('PATCH recusa outro proprietário explicitamente',async()=>{const r=await endpointMensagens(request('PATCH',{ids:[id],associado_id:b}),'associado');expect(r.status).toBe(403);expect(q.upsert).not.toHaveBeenCalled()})
test('leitura retorna total do backend, sem subtração local e sem duplicar',async()=>{db.rpc.mockResolvedValue({data:2});for(let i=0;i<2;i++){const r=await endpointMensagens(request('PATCH',{ids:[id]}),'associado');expect(await r.json()).toEqual({ok:true,ids:[id],nao_lidas:2})}expect(q.upsert).toHaveBeenCalledWith(expect.any(Array),{onConflict:'mensagem_id,leitor_tipo,leitor_id',ignoreDuplicates:true})})
test('id alheio não grava leitura',async()=>{q.then=(resolve:any)=>resolve({data:[]});const r=await endpointMensagens(request('PATCH',{ids:[id]}),'associado');expect(q.upsert).not.toHaveBeenCalled();expect((await r.json()).ids).toEqual([])})
test('exceção durante autenticação retorna JSON seguro',async()=>{const log=jest.spyOn(console,'error').mockImplementation(()=>{});(sessaoAssociado as jest.Mock).mockRejectedValue(Error('conteúdo interno'));const r=await endpointMensagens(request('GET'),'associado');expect(r.status).toBe(503);expect(r.headers.get('content-type')).toContain('application/json');expect(JSON.stringify(await r.json())).not.toContain('interno');log.mockRestore()})
test('nova sessão usa o mesmo leitor e preserva total de mensagens lidas',async()=>{
 db.rpc.mockResolvedValue({data:0})
 for(const tokenHash of ['sessao-anterior','sessao-apos-novo-login']){
  (sessaoAssociado as jest.Mock).mockResolvedValue({associado:{id:a},db,tokenHash})
  const r=await endpointMensagens(request('GET',undefined,'?resumo=1'),'associado')
  expect(await r.json()).toEqual({nao_lidas:0})
  expect(db.rpc).toHaveBeenLastCalledWith('clube_mensagens_nao_lidas',{p_tipo:'associado',p_id:a})
 }
})
