import {buscarAcademia,registrarAcademia} from '@/lib/portaria-academia'
import {buscarPessoasClube} from '@/lib/busca-pessoas-clube'
jest.mock('@/lib/busca-pessoas-clube',()=>({buscarPessoasClube:jest.fn()}))
const id='12345678-1234-4234-8234-123456789abc'
let socio:any,assinatura:any,contas:any[],erro:boolean,insert:jest.Mock
function db():any{return {from:(t:string)=>{const value=()=>({data:t==='associados'?socio:t==='assinaturas_academia'?assinatura:contas,error:erro&&t==='mensalidades'?{message:'falha'}:null});const q:any={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,maybeSingle:async()=>value(),then:(resolve:any)=>resolve(value()),insert};return q}}}
beforeEach(()=>{jest.clearAllMocks();socio={id,status:'ativo',nome:'Teste',cpf:'privado'};assinatura={id:'ass',status:'ativa',data_inicio:'2020-01-01',data_fim:'2099-01-01',plano:{nome:'Academia'}};contas=[{status:'pago',periodo_inicio:'2020-01-01',periodo_fim:'2099-01-01'}];erro=false;insert=jest.fn().mockResolvedValue({error:null});(buscarPessoasClube as jest.Mock).mockResolvedValue([socio])})
test('leituras emendadas sao rejeitadas sem escolher QR do meio',async()=>{expect(await buscarAcademia(db(),'SOCIO-'+id+'SOCIO-'+id)).toHaveProperty('error');expect(buscarPessoasClube).not.toHaveBeenCalled()})
test('consulta nao expoe CPF nem valores de mensalidades ao porteiro',async()=>{const r=await buscarAcademia(db(),'SOCIO-'+id);expect(r.associado).not.toHaveProperty('cpf');expect(r.pendencias).toEqual([]);expect(r.financeiroOk).toBe(true)})
test('entrada valida reconsulta e grava assinatura do banco',async()=>{expect(await registrarAcademia(db(),id,'entrada')).toEqual({ok:true});expect(insert).toHaveBeenCalledWith({associado_id:id,assinatura_id:'ass',tipo:'entrada'})})
test('sem periodo pago nao entra',async()=>{contas=[];expect(await registrarAcademia(db(),id,'entrada')).toHaveProperty('error');expect(insert).not.toHaveBeenCalled()})
test('inadimplencia impede mesmo havendo outro periodo pago',async()=>{contas.push({status:'atrasado',data_vencimento:'2020-01-01'});expect(await registrarAcademia(db(),id,'entrada')).toHaveProperty('error');expect(insert).not.toHaveBeenCalled()})
test('assinatura vencida ou futura nao entra',async()=>{assinatura.data_fim='2020-01-01';expect(await registrarAcademia(db(),id,'entrada')).toHaveProperty('error');assinatura.data_fim='2099-01-01';assinatura.data_inicio='2098-01-01';expect(await registrarAcademia(db(),id,'entrada')).toHaveProperty('error');expect(insert).not.toHaveBeenCalled()})
test('associado inativo nao entra',async()=>{socio.status='inativo';expect(await registrarAcademia(db(),id,'entrada')).toHaveProperty('error');expect(insert).not.toHaveBeenCalled()})
test('falha ao consultar financeiro nunca libera',async()=>{erro=true;await expect(registrarAcademia(db(),id,'entrada')).rejects.toThrow();expect(insert).not.toHaveBeenCalled()})
test('falha no registro nunca confirma',async()=>{insert.mockResolvedValue({error:{message:'falha'}});await expect(registrarAcademia(db(),id,'entrada')).rejects.toThrow()})
