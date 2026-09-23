import {GET} from '@/app/api/cep/[cep]/route'
import {cacheCep} from '@/lib/cache-cep'
import {acessoRota} from '@/lib/supabase/acesso-rota'
jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
const fetchMock=jest.fn()
beforeEach(()=>{cacheCep.limpar();jest.clearAllMocks();global.fetch=fetchMock;(acessoRota as jest.Mock).mockResolvedValue({user:{id:'test'}})})
const get=(cep='01001000')=>GET(new Request('https://sistema.test/api/cep/'+cep),{params:Promise.resolve({cep})})
test('consulta exige sessao',async()=>{(acessoRota as jest.Mock).mockResolvedValue(null);expect((await get()).status).toBe(401);expect(fetchMock).not.toHaveBeenCalled()})
test('valida CEP antes de consultar provedor',async()=>{expect((await get('12')).status).toBe(400);expect(fetchMock).not.toHaveBeenCalled()})
test('mapeia rua bairro cidade estado e IBGE',async()=>{
 fetchMock.mockResolvedValue({ok:true,json:async()=>({logradouro:'Praça da Sé',bairro:'Sé',localidade:'São Paulo',uf:'SP',ibge:'3550308'})})
 const result=await get();expect(result.status).toBe(200);expect(await result.json()).toEqual({endereco:'Praça da Sé',bairro:'Sé',cidade:'São Paulo',estado:'SP',ibge:'3550308'})
})
test('CEP inexistente retorna mensagem para preenchimento manual',async()=>{fetchMock.mockResolvedValue({ok:true,json:async()=>({erro:true})});expect((await get()).status).toBe(404)})
test('falha externa nao expoe detalhes internos',async()=>{fetchMock.mockRejectedValue(Error('internal details'));const result=await get();expect(result.status).toBe(502);expect(JSON.stringify(await result.json())).not.toContain('internal details')})
