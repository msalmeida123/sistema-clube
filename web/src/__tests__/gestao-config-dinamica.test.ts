jest.mock('node:fs/promises',()=>({readFile:jest.fn()}))
jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
jest.mock('@/lib/associado-app',()=>({appDb:jest.fn()}))
import {readFile} from 'node:fs/promises'
import {appDb} from '@/lib/associado-app'
import {configGestao} from '@/lib/gestao-licencas/servidor'
import {cifrarCredencial} from '@/lib/gestao-licencas/credenciais'
const mestra=Buffer.alloc(32,2),consulta=jest.fn()
beforeEach(()=>{
 process.env.GESTAO_LICENCAS_ATIVA='1'
 ;(readFile as jest.Mock).mockImplementation(async (path:string)=>path.endsWith('gestao_criptografia')?mestra.toString('hex'):JSON.stringify({ambiente:'sandbox',apiKey:'antiga'.repeat(8),webhookToken:'token'.repeat(8),proprietarios:['11111111-1111-4111-8111-111111111111'],url:'https://gestao.example.com'}))
 ;(appDb as jest.Mock).mockReturnValue({from:()=>({select:jest.fn().mockReturnThis(),eq:jest.fn().mockReturnThis(),maybeSingle:consulta})})
})
test('nova chave salva passa a valer sem cache ou reinício',async()=>{
 consulta.mockResolvedValueOnce({data:null,error:null}).mockResolvedValueOnce({data:{api_key_cifrada:cifrarCredencial('nova-chave','sandbox',mestra)},error:null})
 expect((await configGestao()).apiKey).toBe('antiga'.repeat(8))
 expect((await configGestao()).apiKey).toBe('nova-chave')
})
test('credencial corrompida falha sem voltar silenciosamente à chave antiga',async()=>{
 consulta.mockResolvedValue({data:{api_key_cifrada:'corrompida'},error:null})
 await expect(configGestao()).rejects.toThrow()
})
