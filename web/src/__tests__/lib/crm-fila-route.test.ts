import { POST } from '@/app/api/whatsapp/send/route'
const getUser=jest.fn(),rpc=jest.fn(),add=jest.fn()
jest.mock('@supabase/auth-helpers-nextjs',()=>({createRouteHandlerClient:()=>({auth:{getUser},rpc})}))
jest.mock('next/headers',()=>({cookies:jest.fn()}))
jest.mock('@/lib/whatsapp/queue',()=>({getCrmQueue:()=>({add})}))
const body={requestId:'f3000000-0000-4000-8000-000000000001',conversaId:'f3000000-0000-4000-8000-000000000002',text:'Mensagem de teste'}
const request=(data:any=body)=>new Request('http://localhost/api/whatsapp/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
beforeEach(()=>{jest.clearAllMocks();getUser.mockResolvedValue({data:{user:{id:'user'}}});rpc.mockResolvedValue({data:body.requestId,error:null});add.mockResolvedValue({})})
it('aceita mensagem durável e devolve 202, sem alegar envio',async()=>{const r=await POST(request());expect(r.status).toBe(202);expect(await r.json()).toMatchObject({queued:true,messageId:body.requestId});expect(add).not.toHaveBeenCalled()})
it('não usa destinatário fornecido pelo cliente',async()=>{await POST(request({...body,to:'outro numero'}));expect(rpc.mock.calls[0][1].p_payload.to).toBeUndefined()})
it('mantém aceitação durável se Redis estiver fora',async()=>{add.mockRejectedValue(new Error('redis offline'));const spy=jest.spyOn(console,'error').mockImplementation(()=>{});try{expect((await POST(request())).status).toBe(202)}finally{spy.mockRestore()}})
it('rejeita visitante sem sessão',async()=>{getUser.mockResolvedValue({data:{user:null}});expect((await POST(request())).status).toBe(401);expect(rpc).not.toHaveBeenCalled();expect(add).not.toHaveBeenCalled()})
it('não enfileira quando o banco nega acesso',async()=>{rpc.mockResolvedValue({error:{code:'42501'}});expect((await POST(request())).status).toBe(403);expect(add).not.toHaveBeenCalled()})
it('rejeita texto vazio antes de gravar',async()=>{expect((await POST(request({...body,text:' '}))).status).toBe(400);expect(rpc).not.toHaveBeenCalled()})
