import {verificarLicencaCliente} from '@/lib/gestao-licencas/cliente'
const original=process.env
beforeEach(()=>{process.env={...original,LICENCA_EXIGIR:'1',LICENCA_CENTRAL_URL:'https://gestao.example.com',LICENCA_CHAVE:'chave-'+Math.random(),LICENCA_INSTALACAO:'instalacao',LICENCA_DOMINIO:'cliente.example.com',LICENCA_AMBIENTE:'production'};global.fetch=jest.fn()})
afterAll(()=>{process.env=original})
test('instalação legada continua funcionando sem licença nova',async()=>{delete process.env.LICENCA_EXIGIR;expect(await verificarLicencaCliente()).toEqual({status:200});expect(fetch).not.toHaveBeenCalled()})
test('exigir licença sem chave falha fechado',async()=>{delete process.env.LICENCA_CHAVE;expect(await verificarLicencaCliente()).toEqual({status:503})})
test.each([401,402,403])('recusa instalação não autorizada HTTP %s',async status=>{(fetch as jest.Mock).mockResolvedValue(new Response('{}',{status}));expect(await verificarLicencaCliente()).toEqual({status:402})})
test('não libera licença sandbox no cliente de produção',async()=>{(fetch as jest.Mock).mockResolvedValue(Response.json({ativo:true,ambiente:'sandbox',vencimento:'2099-01-01'}));expect(await verificarLicencaCliente()).toEqual({status:402})})
test('liberação é guardada por no máximo 60s; não repete consulta desnecessária',async()=>{(fetch as jest.Mock).mockResolvedValue(Response.json({ativo:true,ambiente:'production',vencimento:'2099-01-01'}));expect(await verificarLicencaCliente()).toEqual({status:200});expect(await verificarLicencaCliente()).toEqual({status:200});expect(fetch).toHaveBeenCalledTimes(1)})
test('indisponibilidade não vira liberação',async()=>{(fetch as jest.Mock).mockRejectedValue(Error());expect(await verificarLicencaCliente()).toEqual({status:503})})
