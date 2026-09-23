import {consultarGestao} from '@/lib/gestao-licencas/http'
afterEach(()=>jest.restoreAllMocks())
test('erro do proxy tem mensagem legível em vez de erro de JSON',async()=>{
 jest.spyOn(global,'fetch').mockResolvedValue(new Response('<html>Bad Gateway</html>',{status:502}))
 await expect(consultarGestao()).rejects.toThrow('HTTP 502')
})
test('preserva erro de autorização da API',async()=>{
 jest.spyOn(global,'fetch').mockResolvedValue(Response.json({error:'Acesso exclusivo do proprietário.'},{status:403}))
 await expect(consultarGestao()).rejects.toThrow('Acesso exclusivo do proprietário.')
})
test('não repete alteração quando a resposta é incerta',async()=>{
 const fetcher=jest.spyOn(global,'fetch').mockResolvedValue(new Response('Bad Gateway',{status:502}))
 await expect(consultarGestao({acao:'plano'})).rejects.toThrow('confira os dados antes de tentar novamente')
 expect(fetcher).toHaveBeenCalledTimes(1)
})
test('desafio do proxy pede recarregar a página',async()=>{
 jest.spyOn(global,'fetch').mockResolvedValue(new Response('challenge',{status:403,headers:{'cf-mitigated':'challenge'}}))
 await expect(consultarGestao()).rejects.toThrow('Recarregue a página')
})
