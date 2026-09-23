import {consultarPortariaClube} from '@/lib/portaria-clube'
const id='12345678-1234-4234-8234-123456789abc'
let dependente:any,socio:any,atrasadas:any[],falha:boolean,registro:jest.Mock
function db():any{return {from:(t:string)=>{
 let campo='',valor='';const q:any={select:()=>q,eq:(c:string,v:string)=>{if(!campo){campo=c;valor=v}return q},in:()=>q,lt:()=>q,order:()=>q,limit:()=>q,
 maybeSingle:async()=>({data:t==='dependentes'&&dependente&&valor===dependente.qr_code?dependente:t==='associados'&&socio&&(campo==='id'?valor===socio.id:campo==='qr_code'?valor===socio.qr_code:false)?socio:null}),
 insert:registro,then:(resolve:any)=>resolve({data:t==='mensalidades'?atrasadas:[],error:falha&&t==='mensalidades'?{message:'database error'}:null})};return q
}}}
beforeEach(()=>{dependente=null;socio={id,nome:'Teste',status:'ativo',qr_code:'QR-ATUAL',cpf:'privado',email:'privado',numero_titulo:'001'};atrasadas=[];falha=false;registro=jest.fn().mockResolvedValue({error:null})})
test('QR atual valida e registra sem expor dados pessoais extras',async()=>{const r=await consultarPortariaClube(db(),{tipo:'leitor',valor:'QR-ATUAL'});expect(r.autorizado).toBe(true);expect(r.pessoa).not.toHaveProperty('cpf');expect(r.pessoa).not.toHaveProperty('email');expect(registro).toHaveBeenCalledWith(expect.objectContaining({local:'clube',pessoa_id:id}))})
test('mensalidade vencida impede entrada sem expor financeiro',async()=>{atrasadas=[{id:'m',valor:123}];const r=await consultarPortariaClube(db(),{tipo:'leitor',valor:'QR-ATUAL'});expect(r.autorizado).toBe(false);expect(r).not.toHaveProperty('mensalidadesPendentes');expect(registro).not.toHaveBeenCalled()})
test('falha ao ler mensalidades nunca libera',async()=>{falha=true;await expect(consultarPortariaClube(db(),{tipo:'leitor',valor:'QR-ATUAL'})).rejects.toThrow();expect(registro).not.toHaveBeenCalled()})
test('inativo nao entra',async()=>{socio.status='inativo';expect((await consultarPortariaClube(db(),{tipo:'leitor',valor:'QR-ATUAL'})).autorizado).toBe(false);expect(registro).not.toHaveBeenCalled()})
test('UUID legado funciona somente sem QR personalizado',async()=>{expect((await consultarPortariaClube(db(),{tipo:'leitor',valor:id})).autorizado).toBe(false);socio.qr_code=null;expect((await consultarPortariaClube(db(),{tipo:'leitor',valor:id})).autorizado).toBe(true)})
test('escolha adulterada nao registra outra pessoa',async()=>{expect((await consultarPortariaClube(db(),{tipo:'leitor',valor:'QR-ATUAL',escolhida:'outro'})).autorizado).toBe(false);expect(registro).not.toHaveBeenCalled()})
test('falha no registro nunca confirma entrada',async()=>{registro.mockResolvedValue({error:{message:'falha'}});await expect(consultarPortariaClube(db(),{tipo:'leitor',valor:'QR-ATUAL'})).rejects.toThrow('registrar')})

test('retorna foto do associado consultado',async()=>{socio.foto_url='/foto-titular.jpg';const r=await consultarPortariaClube(db(),{tipo:'leitor',valor:'QR-ATUAL'});expect(r.pessoa?.foto_url).toBe('/foto-titular.jpg')})
test('dependente apresenta sua própria foto, mesmo com acesso negado',async()=>{socio.foto_url='/titular.jpg';dependente={id:'dep',nome:'Dependente',qr_code:'DEP-TESTE',status:'inativo',associado_id:id,foto_url:'/dependente.jpg'};const r=await consultarPortariaClube(db(),{tipo:'leitor',valor:'DEP-TESTE'});expect(r.tipo).toBe('dependente');expect(r.pessoa?.foto_url).toBe('/dependente.jpg');expect(registro).not.toHaveBeenCalled()})
test('dependente sem foto não usa foto do titular',async()=>{socio.foto_url='/titular.jpg';dependente={id:'dep',nome:'Dependente',qr_code:'DEP-TESTE',status:'inativo',associado_id:id};const r=await consultarPortariaClube(db(),{tipo:'leitor',valor:'DEP-TESTE'});expect(r.pessoa?.foto_url).toBeNull()})

test.each(['individual','familiar','patrimonial'])('retorna título e categoria %s do titular',async plano=>{socio.plano=plano;const r=await consultarPortariaClube(db(),{tipo:'leitor',valor:'QR-ATUAL'});expect(r.pessoa).toMatchObject({nome:'Teste',numero_titulo:'001',plano,tipo:'associado'})})
test('dependente herda título e categoria, preservando nome e foto próprios',async()=>{socio.plano='familiar';dependente={id:'dep',nome:'Nome dependente',qr_code:'DEP-TESTE',status:'inativo',associado_id:id,foto_url:'/dep.jpg'};const r=await consultarPortariaClube(db(),{tipo:'leitor',valor:'DEP-TESTE'});expect(r.pessoa).toMatchObject({nome:'Nome dependente',numero_titulo:'001',plano:'familiar',tipo:'dependente',foto_url:'/dep.jpg'})})
