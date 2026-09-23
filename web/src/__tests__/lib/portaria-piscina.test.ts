import {buscarPiscina,registrarPiscina} from '@/lib/portaria-piscina'
import {buscarPessoasClube} from '@/lib/busca-pessoas-clube'
jest.mock('@/lib/busca-pessoas-clube',()=>({buscarPessoasClube:jest.fn()}))
const id='12345678-1234-4234-8234-123456789abc'
let associado:any,exame:any,erroExame:boolean,insert:jest.Mock, filtros:any[]
function db():any{return {from:(t:string)=>{const q:any={select:()=>q,eq:(...a:any[])=>{filtros.push(a);return q},is:(...a:any[])=>{filtros.push(a);return q},gte:(...a:any[])=>{filtros.push(a);return q},lte:(...a:any[])=>{filtros.push(a);return q},order:()=>q,limit:()=>q,maybeSingle:async()=>({data:t==='associados'?associado:exame,error:t==='exames_medicos'&&erroExame?{message:'falha'}:null}),insert};return q}}}
beforeEach(()=>{jest.clearAllMocks();associado={id,status:'ativo',nome:'Teste',cpf:'privado',qr_code:null};exame={id:'exame',resultado:'apto',data_validade:'2099-01-01'};erroExame=false;filtros=[];insert=jest.fn().mockResolvedValue({error:null});(buscarPessoasClube as jest.Mock).mockResolvedValue([associado])})
test('busca retorna somente dados de identificação necessários',async()=>{const r=await buscarPiscina(db(),'SOCIO-'+id);expect(r.associado).not.toHaveProperty('cpf');expect(filtros).toContainEqual(['tipo_exame','piscina']);expect(filtros).toContainEqual(['dependente_id',null])})
test('entrada revalida exame e registra',async()=>{expect(await registrarPiscina(db(),id,'entrada')).toEqual({ok:true});expect(insert).toHaveBeenCalledWith({associado_id:id,tipo:'entrada',exame_valido:true});expect(filtros).toContainEqual(['resultado','apto'])})
test('sem exame vigente nega entrada',async()=>{exame=null;expect(await registrarPiscina(db(),id,'entrada')).toHaveProperty('error');expect(insert).not.toHaveBeenCalled()})
test('inativo nao entra',async()=>{associado.status='inativo';expect(await registrarPiscina(db(),id,'entrada')).toHaveProperty('error');expect(insert).not.toHaveBeenCalled()})
test('falha no exame nunca libera',async()=>{erroExame=true;await expect(registrarPiscina(db(),id,'entrada')).rejects.toThrow();expect(insert).not.toHaveBeenCalled()})
test('saida de ativo permite exame vencido',async()=>{exame=null;expect(await registrarPiscina(db(),id,'saida')).toEqual({ok:true});expect(insert).toHaveBeenCalledWith({associado_id:id,tipo:'saida',exame_valido:false})})
test('falha ao gravar nao confirma entrada',async()=>{insert.mockResolvedValue({error:{message:'falha'}});await expect(registrarPiscina(db(),id,'entrada')).rejects.toThrow()})
