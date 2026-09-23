import {cnpjValido,formatarCnpj,dadosDocumento} from '@/lib/cnpj'
import {GET} from '@/app/api/cnpj/[cnpj]/route'
import {acessoRota} from '@/lib/supabase/acesso-rota'
jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
const get=(cnpj='19131243000197')=>GET(new Request('http://x'),{params:Promise.resolve({cnpj})})
beforeEach(()=>{jest.clearAllMocks();global.fetch=jest.fn();(acessoRota as jest.Mock).mockResolvedValue({user:{id:'x'}})})
test('valida CNPJ numérico e alfanumérico, rejeita DV incorreto',()=>{expect(cnpjValido('19.131.243/0001-97')).toBe(true);expect(cnpjValido('00.000.000/E08G-12')).toBe(true);expect(cnpjValido('19131243000198')).toBe(false);expect(cnpjValido('00000000000000')).toBe(false);expect(formatarCnpj('00000000E08G12')).toBe('00.000.000/E08G-12')})
test('PJ não reutiliza o CPF ou RG de um formulário PF',()=>{const f=dadosDocumento({tipo_cadastro:'pj',cnpj:'19.131.243/0001-97',cpf:'11111111111',rg:'123',titulo_eleitor:'123',data_nascimento:'2000-01-01',nome_fantasia:'Empresa'});expect(f.cpf).toBeNull();expect(f.rg).toBeNull();expect(f.data_nascimento).toBeNull();expect(f.cnpj).toBe('19131243000197')})
test('consulta exige permissão e valida antes do provedor',async()=>{(acessoRota as jest.Mock).mockResolvedValue(null);expect((await get()).status).toBe(403);(acessoRota as jest.Mock).mockResolvedValue({});expect((await get('123')).status).toBe(400);expect(fetch).not.toHaveBeenCalled()})
test('não expõe dados de sócios ou detalhes do provedor',async()=>{(fetch as jest.Mock).mockResolvedValue({ok:true,headers:new Headers({'content-type':'application/json'}),json:async()=>({cnpj:'19131243000197',razao_social:'EMPRESA TESTE',nome_fantasia:'TESTE',qsa:[{cpf:'segredo'}],logradouro:'RUA',municipio:'Cidade',uf:'SP'})});const r=await get();expect(r.status).toBe(200);const d=await r.json();expect(d.nome).toBe('EMPRESA TESTE');expect(d.qsa).toBeUndefined()})
test('empresa ausente permite preenchimento manual',async()=>{(fetch as jest.Mock).mockResolvedValue({ok:false,status:404});const r=await get('00000000E08G12');expect(r.status).toBe(404);expect((await r.json()).error).toContain('manualmente')})

test('falha ao verificar sessão devolve JSON em vez de HTML',async()=>{(acessoRota as jest.Mock).mockRejectedValue(Error('banco'));const r=await get();expect(r.status).toBe(503);expect(r.headers.get('content-type')).toContain('application/json');expect(fetch).not.toHaveBeenCalled()})
