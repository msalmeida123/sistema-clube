import {NextRequest} from 'next/server'
import {GET,DELETE,PUT} from '@/app/api/configuracoes/verso-carteirinha/route'
import {GET as imagem} from '@/app/api/tema/verso-carteirinha/route'
import {atorTema,clubeTema,ErroTema} from '@/lib/tema/servidor'
import {appDb} from '@/lib/associado-app'
jest.mock('@/lib/tema/servidor',()=>{const real=jest.requireActual('@/lib/tema/servidor');return {...real,atorTema:jest.fn(),clubeTema:jest.fn()}})
jest.mock('@/lib/associado-app',()=>({appDb:jest.fn(),limite:jest.fn()}))
const eq=jest.fn(),single=jest.fn(),del=jest.fn(),select=jest.fn(),from=jest.fn()
beforeEach(()=>{jest.clearAllMocks();(atorTema as jest.Mock).mockResolvedValue({clube:'clube-a',user:{id:'admin-a'}});(clubeTema as jest.Mock).mockResolvedValue('clube-b');single.mockResolvedValue({data:null,error:null});eq.mockReturnValue({maybeSingle:single});select.mockReturnValue({eq});del.mockReturnValue({eq});from.mockReturnValue({select,delete:del});(appDb as jest.Mock).mockReturnValue({from})})
it('rejeita usuário não administrador antes de consultar dados',async()=>{(atorTema as jest.Mock).mockRejectedValue(new ErroTema(403,'Sem permissão'));expect((await GET()).status).toBe(403);expect(from).not.toHaveBeenCalled()})
it('rejeita upload de outra origem antes de acessar banco',async()=>{const r=await PUT(new NextRequest('https://clube.test/api/configuracoes/verso-carteirinha',{method:'PUT',headers:{host:'clube.test',origin:'https://outro.test'},body:'x'}));expect(r.status).toBe(403);expect(from).not.toHaveBeenCalled()})
it('consulta metadados pelo clube do administrador',async()=>{expect((await GET()).status).toBe(200);expect(eq).toHaveBeenCalledWith('clube_id','clube-a')})
it('imagem pública usa apenas o clube resolvido pelo domínio',async()=>{const r=await imagem(new NextRequest('https://clube.test/api/tema/verso-carteirinha?clube_id=outro'));expect(r.status).toBe(204);expect(eq).toHaveBeenCalledWith('clube_id','clube-b')})
it('remove apenas o verso do clube autenticado',async()=>{eq.mockResolvedValueOnce({error:null});const r=await DELETE(new NextRequest('https://clube.test/api/configuracoes/verso-carteirinha',{method:'DELETE',headers:{host:'clube.test',origin:'https://clube.test'}}));expect(r.status).toBe(200);expect(eq).toHaveBeenCalledWith('clube_id','clube-a')})
