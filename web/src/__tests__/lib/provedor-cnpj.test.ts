import {consultarProvedorCnpj} from '@/lib/provedor-cnpj'
const cnpj='00000000000191'
const empresa={cnpj,razao_social:'Empresa teste'}
beforeEach(()=>{global.fetch=jest.fn()})
test('usa a fonte seguinte após bloqueio 403',async()=>{(fetch as jest.Mock).mockResolvedValueOnce(new Response('{}',{status:403})).mockResolvedValueOnce(Response.json(empresa));await expect(consultarProvedorCnpj(cnpj)).resolves.toEqual(empresa);expect(fetch).toHaveBeenCalledTimes(2)})
test('HTML do provedor não chega ao formulário',async()=>{(fetch as jest.Mock).mockResolvedValueOnce(new Response('<html>bloqueado</html>',{headers:{'content-type':'text/html'}})).mockResolvedValueOnce(Response.json(empresa));await expect(consultarProvedorCnpj(cnpj)).resolves.toEqual(empresa)})
test('não confunde provedor bloqueado com empresa inexistente',async()=>{(fetch as jest.Mock).mockResolvedValueOnce(new Response('',{status:404})).mockResolvedValueOnce(new Response('',{status:403}));await expect(consultarProvedorCnpj(cnpj)).rejects.toThrow('provedor')})
test('rejeita dados de outro CNPJ',async()=>{(fetch as jest.Mock).mockResolvedValue(Response.json({...empresa,cnpj:'19131243000197'}));await expect(consultarProvedorCnpj(cnpj)).rejects.toThrow('provedor')})
