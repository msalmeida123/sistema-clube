import {NextRequest} from 'next/server'
import {POST} from '@/app/api/associado-app/auth/route'
import {consume} from '../../operacao/login-rate.cjs'
import {appDb} from '@/lib/associado-app'
jest.mock('../../operacao/login-rate.cjs',()=>({consume:jest.fn()}))
jest.mock('@/lib/enviar-acesso-associado',()=>({enviarAcessoAssociado:jest.fn()}))
jest.mock('@/lib/associado-app',()=>{const a=jest.requireActual('@/lib/associado-app');return {...a,appDb:jest.fn(),origemValida:()=>true}})
const request=()=>new NextRequest('https://app.test/api/associado-app/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({acao:'entrar',cpf:'000.000.000-00',senha:'invalid'})})
let db:any
beforeEach(()=>{jest.clearAllMocks();db={rpc:jest.fn(async()=>({data:[],error:null}))};(appDb as jest.Mock).mockReturnValue(db)})
it('bloqueia no Redis antes da consulta de credenciais',async()=>{(consume as jest.Mock).mockResolvedValue({allowed:false,retryAfter:50});const r=await POST(request());expect(r.status).toBe(429);expect(r.headers.get('retry-after')).toBe('50');expect(db.rpc).not.toHaveBeenCalled();expect(consume).toHaveBeenCalledWith('associado','00000000000',20)})
it('Redis indisponível retorna 503 sem fallback',async()=>{(consume as jest.Mock).mockRejectedValue(new Error('offline'));expect((await POST(request())).status).toBe(503);expect(db.rpc).not.toHaveBeenCalled()})
it('limite permitido segue para autenticação e não consulta contador PostgreSQL',async()=>{(consume as jest.Mock).mockResolvedValue({allowed:true,retryAfter:900});expect((await POST(request())).status).toBe(401);expect(db.rpc).toHaveBeenCalledWith('app_associado_por_cpf',{p_cpf:'00000000000'});expect(db.rpc).toHaveBeenCalledTimes(1)})

import {scryptSync} from 'node:crypto'
import {confereSenha} from '@/lib/senhas-associado'
it.each([true,false])('migra com comparação do hash antigo; alteração concorrente=%s',async concorrente=>{
 (consume as jest.Mock).mockResolvedValue({allowed:true,retryAfter:900})
 const salt='a'.repeat(32),antigo=salt+':'+scryptSync('invalid',salt,64).toString('hex')
 db.rpc.mockResolvedValue({data:[{id:'teste'}],error:null})
 const leitura:any={select:jest.fn(()=>leitura),eq:jest.fn(()=>leitura),maybeSingle:jest.fn(async()=>({data:{senha_hash:antigo},error:null}))}
 const escrita:any={eq:jest.fn(()=>escrita),select:jest.fn(()=>escrita),maybeSingle:jest.fn(async()=>({data:concorrente?null:{associado_id:'teste'},error:null}))}
 const update=jest.fn(()=>escrita),insert=jest.fn(async()=>({error:null}))
 db.from=jest.fn((nome:string)=>nome==='associado_app_sessoes'?{insert}:{...leitura,update})
 const r=await POST(request())
 expect(update).toHaveBeenCalledTimes(1)
 const novo=update.mock.calls[0] as unknown as [{senha_hash:string}]
 expect(await confereSenha('invalid',novo[0].senha_hash)).toBe(true)
 expect(escrita.eq).toHaveBeenCalledWith('senha_hash',antigo)
 expect(r.status).toBe(concorrente?401:200)
 expect(insert).toHaveBeenCalledTimes(concorrente?0:1)
})
