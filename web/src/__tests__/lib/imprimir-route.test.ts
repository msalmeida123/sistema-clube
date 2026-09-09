/** @jest-environment node */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/bar/imprimir/route'
import { GET, PUT } from '@/app/api/bar/impressora/route'
const mockAuth=jest.fn(), mockEnviar=jest.fn(), mockInsert=jest.fn(), mockUpdate=jest.fn()
const config={nome:'Cozinha',ip:'192.168.1.150',porta:9100,colunas:48,protocolo:'texto',cortar:false,ativo:true}
let pedido: any
const mockDB={from:(table:string)=>({select:()=>({eq:()=>({single:async()=>({data:table==='bar_impressora'?config:pedido})})}),insert:mockInsert,update:()=>({eq:mockUpdate})})}
jest.mock('@/lib/bar-impressao-auth',()=>({autorizarImpressao:(...args:any[])=>mockAuth(...args)}))
jest.mock('@/lib/impressora-rede',()=>({...jest.requireActual('@/lib/impressora-rede'),enviarBytes:(...args:any[])=>mockEnviar(...args)}))
const body={id:'10000000-0000-4000-8000-000000000001',pedido_id:'10000000-0000-4000-8000-000000000002',reimpressao:false}
const req=(data:any=body)=>new NextRequest('http://localhost/api/bar/imprimir',{method:'POST',body:JSON.stringify(data)})
beforeEach(()=>{jest.clearAllMocks();mockAuth.mockResolvedValue({status:200,user:{id:'operador'},db:mockDB});mockInsert.mockResolvedValue({error:null});mockUpdate.mockResolvedValue({error:null});mockEnviar.mockResolvedValue(undefined);pedido={id:body.pedido_id,status:'pago',numero_pedido:1,created_at:new Date().toISOString(),bar_itens_pedido:[{enviar_cozinha:true,produto_nome:'Pizza',quantidade:1}]}})
test('configuração exige admin e envio exige permissão',async()=>{
  mockAuth.mockResolvedValue({status:403})
  expect((await GET()).status).toBe(403)
  expect(mockAuth).toHaveBeenCalledWith(true)
  expect((await PUT(req())).status).toBe(403)
  expect((await POST(req())).status).toBe(403)
  expect(mockEnviar).not.toHaveBeenCalled()
})
test('teste físico também exige admin',async()=>{await POST(req({teste:true}));expect(mockAuth).toHaveBeenCalledWith(true)})
test('duplicação do registro bloqueia novo envio',async()=>{mockInsert.mockResolvedValue({error:{code:'23505'}});expect((await POST(req())).status).toBe(409);expect(mockEnviar).not.toHaveBeenCalled()})
test('pedido cancelado não é enviado',async()=>{pedido.status='cancelado';expect((await POST(req())).status).toBe(409);expect(mockEnviar).not.toHaveBeenCalled()})
test('falha TCP não é repetida automaticamente',async()=>{mockEnviar.mockRejectedValue(new Error('Falha TCP'));expect((await POST(req())).status).toBe(502);expect(mockEnviar).toHaveBeenCalledTimes(1);expect(mockUpdate).toHaveBeenCalled()})
test('envio concluído atualiza registro',async()=>{expect((await POST(req())).status).toBe(200);expect(mockEnviar).toHaveBeenCalledTimes(1);expect(mockUpdate).toHaveBeenCalled()})
