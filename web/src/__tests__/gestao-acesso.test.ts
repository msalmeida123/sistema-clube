jest.mock('node:fs/promises',()=>({readFile:jest.fn()}))
jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
jest.mock('@/lib/associado-app',()=>({appDb:jest.fn()}))
import {readFile} from 'node:fs/promises'
import {NextRequest} from 'next/server'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {appDb} from '@/lib/associado-app'
import {donoGestao,novaChave,hashChave} from '@/lib/gestao-licencas/servidor'
const dono='11111111-1111-4111-8111-111111111111'
beforeEach(()=>{const q:any={select:jest.fn().mockReturnThis(),eq:jest.fn().mockReturnThis(),maybeSingle:jest.fn().mockResolvedValue({data:null,error:null})};(appDb as jest.Mock).mockReturnValue({from:jest.fn(()=>q)})})
beforeEach(()=>{jest.clearAllMocks();process.env.GESTAO_LICENCAS_ATIVA='1';(readFile as jest.Mock).mockResolvedValue(JSON.stringify({ambiente:'sandbox',apiKey:'a'.repeat(32),webhookToken:'b'.repeat(32),proprietarios:[dono],url:'https://gestao.example.com'}))})
test('admin de clube não recebe acesso ao painel central',async()=>{(acessoRota as jest.Mock).mockResolvedValue({admin:true,user:{id:'22222222-2222-4222-8222-222222222222'}});await expect(donoGestao()).rejects.toMatchObject({status:403})})
test('recusa sem sessão',async()=>{(acessoRota as jest.Mock).mockResolvedValue(null);await expect(donoGestao()).rejects.toMatchObject({status:403})})
test('somente proprietário ativo permitido',async()=>{(acessoRota as jest.Mock).mockResolvedValue({user:{id:dono}});expect((await donoGestao()).ator.user.id).toBe(dono)})
test('origem cruzada é recusada antes de qualquer mutação',async()=>{await expect(donoGestao(new NextRequest('https://gestao.example.com/api/gestao-clientes',{method:'POST',headers:{origin:'https://evil.example'}}))).rejects.toMatchObject({status:403})})
test('cliente não expõe a central',async()=>{delete process.env.GESTAO_LICENCAS_ATIVA;await expect(donoGestao()).rejects.toMatchObject({status:404})})
test('chaves aleatórias não revelam o hash armazenado',()=>{const a=novaChave(),b=novaChave();expect(a).toMatch(/^CLUBE_[A-Za-z0-9_-]{43}$/);expect(a).not.toBe(b);expect(hashChave(a)).toHaveLength(64);expect(hashChave(a)).not.toContain(a)})
