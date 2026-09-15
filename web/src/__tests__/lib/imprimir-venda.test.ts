import {NextRequest,NextResponse} from 'next/server'
import {POST} from '@/app/api/bar/imprimir-venda/route'
import {autorizarImpressao} from '@/lib/bar-impressao-auth'
import {POST as rede} from '@/app/api/bar/imprimir/route'
import {POST as usb} from '@/app/api/bar/impressao-local/route'
jest.mock('@/lib/bar-impressao-auth',()=>({autorizarImpressao:jest.fn()}))
jest.mock('@/app/api/bar/imprimir/route',()=>({POST:jest.fn()}))
jest.mock('@/app/api/bar/impressao-local/route',()=>({POST:jest.fn()}))
const id='12345678-1234-4234-8234-123456789abc'
let configs:Record<string,any>
const run=(destino='automatico')=>POST(new NextRequest('http://localhost/api/bar/imprimir-venda',{method:'POST',body:JSON.stringify({pedido_id:id,destino})}))
beforeEach(()=>{
 jest.clearAllMocks()
 configs={bar_impressora:{ativo:true},bar_pedidos:{status:'pago',bar_itens_pedido:[{enviar_cozinha:true}]},impressao_local_config:{automatico:true,balcao:'USB'}}
 const db={from:(table:string)=>{const end=async()=>({data:configs[table]});return {select:()=>({eq:()=>({single:end,maybeSingle:end})})}}};
 (autorizarImpressao as jest.Mock).mockResolvedValue({db,status:200});
 for(const fn of [rede,usb]) (fn as jest.Mock).mockImplementation(async()=>NextResponse.json({mensagem:'Enviado'}))
})
test('cozinha rede e balcao USB recebem destinos separados',async()=>{
 expect((await run()).status).toBe(200)
 expect(rede).toHaveBeenCalledTimes(1);expect(usb).toHaveBeenCalledTimes(1)
 expect(await (usb as jest.Mock).mock.calls[0][0].json()).toMatchObject({destino:'balcao'})
 expect(await (rede as jest.Mock).mock.calls[0][0].json()).toMatchObject({id,pedido_id:id,reimpressao:false})
})
test('botao cozinha usa rede mesmo sem agente USB',async()=>{configs.impressao_local_config=null;expect((await run('cozinha')).status).toBe(200);expect(rede).toHaveBeenCalled();expect(usb).not.toHaveBeenCalled()})
test('rede desativada preserva fluxo USB',async()=>{configs.bar_impressora.ativo=false;await run();expect(rede).not.toHaveBeenCalled();expect(usb).toHaveBeenCalled()})
test('itens sem cozinha nao enviam comanda de rede',async()=>{configs.bar_pedidos.bar_itens_pedido=[];await run();expect(rede).not.toHaveBeenCalled()})
test('falha de rede nao envia cozinha para USB nem impede balcao',async()=>{(rede as jest.Mock).mockResolvedValue(NextResponse.json({error:'Falha de rede'},{status:502}));expect((await run()).status).toBe(502);expect(await (usb as jest.Mock).mock.calls[0][0].json()).toMatchObject({destino:'balcao'})})
test('exige autorizacao antes de imprimir',async()=>{(autorizarImpressao as jest.Mock).mockResolvedValue({status:401});expect((await run()).status).toBe(401);expect(rede).not.toHaveBeenCalled();expect(usb).not.toHaveBeenCalled()})
