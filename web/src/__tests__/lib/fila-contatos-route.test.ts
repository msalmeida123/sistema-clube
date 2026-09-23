import {POST,GET} from '@/app/api/wasender/sync-contacts/route'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {filaContatos} from '@/lib/fila-contatos'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
jest.mock('@/lib/fila-contatos',()=>({filaContatos:jest.fn()}))
jest.mock('@/lib/supabase/servico-auditado',()=>({servicoAuditado:jest.fn()}))
const post=()=>POST(new Request('https://sistema.test/api/wasender/sync-contacts',{method:'POST',headers:{origin:'https://sistema.test'}}))
beforeEach(()=>{jest.clearAllMocks();process.env.NEXT_PUBLIC_SUPABASE_URL='https://sistema.test'})
test('não enfileira sem administrador',async()=>{(acessoRota as jest.Mock).mockResolvedValue(null);expect((await post()).status).toBe(403);expect(filaContatos).not.toHaveBeenCalled()})
test('resposta só confirma tarefa depois de salvar na fila',async()=>{
 (acessoRota as jest.Mock).mockResolvedValue({user:{id:'op'},admin:true});const q:any={select:()=>q,or:()=>q,order:()=>q,limit:async()=>({data:[{id:'contato'}]})};(servicoAuditado as jest.Mock).mockReturnValue({from:()=>q})
 const add=jest.fn().mockRejectedValue(Error('redis'));(filaContatos as jest.Mock).mockReturnValue({add});expect((await post()).status).toBe(503)
 add.mockResolvedValue({id:'1'});const r=await post();expect(r.status).toBe(202);expect((await r.json()).jobId).toBe('1')
})
test('progresso de outro operador não é exposto',async()=>{(acessoRota as jest.Mock).mockResolvedValue({user:{id:'op'},admin:true});(filaContatos as jest.Mock).mockReturnValue({getJob:async()=>({data:{owner:'outro'}})});expect((await GET(new Request('https://sistema.test?jobId=1'))).status).toBe(404)})
