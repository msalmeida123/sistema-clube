import {GET} from '@/app/api/infracoes/relatos/route'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
jest.mock('@/lib/supabase/servico-auditado',()=>({servicoAuditado:jest.fn()}))
beforeEach(()=>{jest.clearAllMocks();(acessoRota as jest.Mock).mockResolvedValue({user:{id:'equipe'}})})
function banco(count:number|null,error:any=null){
 const lista={select:jest.fn().mockReturnThis(),order:jest.fn().mockReturnThis(),limit:jest.fn().mockResolvedValue({data:Array(200).fill({status:'recebido'}),error:null})}
 const total={select:jest.fn().mockReturnThis(),eq:jest.fn().mockResolvedValue({count,error})}
 ;(servicoAuditado as jest.Mock).mockReturnValue({from:jest.fn().mockReturnValueOnce(lista).mockReturnValueOnce(total)})
 return {lista,total}
}
test('conta recebidos além do limite dos 200 relatos exibidos',async()=>{const {total}=banco(250);const r=await GET();expect(r.status).toBe(200);expect((await r.json()).recebidos).toBe(250);expect(total.eq).toHaveBeenCalledWith('status','recebido');expect(total.select).toHaveBeenCalledWith('id',{count:'exact',head:true})})
test('zero é uma contagem válida',async()=>{banco(0);expect((await (await GET()).json()).recebidos).toBe(0)})
test.each([[null,null],[null,{message:'indisponível'}]])('falha de contagem não vira zero',async(count,error)=>{banco(count,error);expect((await GET()).status).toBe(500)})
test('sem permissão não consulta os relatos',async()=>{(acessoRota as jest.Mock).mockResolvedValue(null);expect((await GET()).status).toBe(403);expect(servicoAuditado).not.toHaveBeenCalled()})
