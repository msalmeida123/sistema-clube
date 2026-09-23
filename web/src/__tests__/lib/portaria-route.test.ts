import {NextRequest} from 'next/server'
import {POST} from '@/app/api/portaria/clube/route'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {consultarPortariaClube} from '@/lib/portaria-clube'
jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
jest.mock('@/lib/supabase/servico-auditado',()=>({servicoAuditado:jest.fn()}))
jest.mock('@/lib/portaria-clube',()=>({consultarPortariaClube:jest.fn()}))
const run=(origin='https://sistema.test')=>POST(new NextRequest('https://sistema.test/api/portaria/clube',{method:'POST',headers:{origin},body:JSON.stringify({tipo:'leitor',valor:'QR'})}))
beforeEach(()=>{jest.clearAllMocks();process.env.NEXT_PUBLIC_SUPABASE_URL='https://sistema.test';(acessoRota as jest.Mock).mockResolvedValue(null)})
test('sem permissao clube nao usa cliente privilegiado',async()=>{expect((await run()).status).toBe(403);expect(acessoRota).toHaveBeenCalledWith('portaria');expect(servicoAuditado).not.toHaveBeenCalled()})
test('origem externa negada',async()=>{expect((await run('https://outro.test')).status).toBe(403);expect(servicoAuditado).not.toHaveBeenCalled()})
test('portaria funciona sem conceder acesso financeiro',async()=>{(acessoRota as jest.Mock).mockImplementation(async(m:string)=>m==='portaria'?{user:{id:'operador'}}:null);(consultarPortariaClube as jest.Mock).mockResolvedValue({autorizado:true});expect((await run()).status).toBe(200);expect(servicoAuditado).toHaveBeenCalledWith('operador');expect(consultarPortariaClube).toHaveBeenCalledWith(undefined,{tipo:'leitor',valor:'QR'},false)})
