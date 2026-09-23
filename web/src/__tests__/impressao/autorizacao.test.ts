import {NextRequest} from 'next/server'
import {GET} from '@/app/api/impressao/autorizar/route'
import {GET as gerar} from '@/app/api/relatorios/setores/route'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {buscarUsuarioAtual} from '@/lib/usuario-atual'
import {dadosSetor} from '@/lib/relatorios-setores-servidor'
jest.mock('next/headers',()=>({cookies:jest.fn()}))
jest.mock('@/lib/supabase/route-client',()=>({createRouteHandlerClient:jest.fn()}))
jest.mock('@/lib/usuario-atual',()=>({buscarUsuarioAtual:jest.fn()}))
jest.mock('@/lib/relatorios-setores-servidor',()=>({setoresRelatorio:['piscina'],dadosSetor:jest.fn().mockResolvedValue({acessos:[]})}))
let db:any
beforeEach(()=>{jest.clearAllMocks();const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{nome_clube:'Clube A'}})};db={auth:{getUser:async()=>({data:{user:{id:'user-A'}}})},rpc:jest.fn().mockResolvedValue({data:[],error:null}),from:()=>q};(createRouteHandlerClient as jest.Mock).mockResolvedValue(db);(buscarUsuarioAtual as jest.Mock).mockResolvedValue({ativo:true,is_admin:true,clube_id:'clube-A'})})
test('sem sessão recebe 401',async()=>{db.auth.getUser=async()=>({data:{user:null}});expect((await GET(new NextRequest('http://localhost/api/impressao/autorizar?rota=/dashboard/relatorios'))).status).toBe(401)})
test('sem permissão recebe 403',async()=>{(buscarUsuarioAtual as jest.Mock).mockResolvedValue({ativo:true,is_admin:false,clube_id:'A'});expect((await GET(new NextRequest('http://localhost/api/impressao/autorizar?rota=/dashboard/relatorios'))).status).toBe(403)})
test('usuário ativo autorizado pela permissão da rota',async()=>{(buscarUsuarioAtual as jest.Mock).mockResolvedValue({ativo:true,is_admin:false,clube_id:'A'});db.rpc.mockResolvedValue({data:[{rota:'/dashboard/relatorios',pode_visualizar:true}]});expect((await GET(new NextRequest('http://localhost/api/impressao/autorizar?rota=/dashboard/relatorios'))).status).toBe(200)})
test('clube enviado pelo navegador é ignorado',async()=>{expect((await gerar(new NextRequest('http://localhost/api/relatorios/setores?setor=piscina&inicio=2026-09-01&fim=2026-09-16&clube_id=clube-B'))).status).toBe(200);expect(dadosSetor).toHaveBeenCalledWith(db,'clube-A','piscina','2026-09-01T00:00:00-03:00','2026-09-16T23:59:59.999-03:00')})
test('filtros inválidos não consultam dados',async()=>{expect((await gerar(new NextRequest('http://localhost/api/relatorios/setores?setor=piscina&inicio=2026-09-20&fim=2026-09-01'))).status).toBe(400);expect(dadosSetor).not.toHaveBeenCalled()})
test('erro do banco não revela informações técnicas',async()=>{(dadosSetor as jest.Mock).mockRejectedValueOnce(Error('SQL SECRET'));const r=await gerar(new NextRequest('http://localhost/api/relatorios/setores?setor=piscina&inicio=2026-09-01&fim=2026-09-16'));expect(r.status).toBe(503);expect(await r.text()).not.toContain('SECRET')})
