import {CacheMemoria} from '@/lib/cache-memoria'
import {paginacao} from '@/lib/paginacao'
test('cache reúne consultas simultâneas e expira',async()=>{
 jest.useFakeTimers();const cache=new CacheMemoria<number>(100,2);const load=jest.fn().mockResolvedValue(7)
 expect(await Promise.all([cache.obter('a',load),cache.obter('a',load)])).toEqual([7,7]);expect(load).toHaveBeenCalledTimes(1)
 jest.advanceTimersByTime(101);await cache.obter('a',load);expect(load).toHaveBeenCalledTimes(2);jest.useRealTimers()
})
test('falhas não são guardadas e o cache tem limite',async()=>{
 const cache=new CacheMemoria<number>(10000,1);const load=jest.fn().mockRejectedValueOnce(Error('fora')).mockResolvedValue(1)
 await expect(cache.obter('a',load)).rejects.toThrow();expect(await cache.obter('a',load)).toBe(1)
 await cache.obter('b',async()=>2);await cache.obter('a',load);expect(load).toHaveBeenCalledTimes(3)
})
test('paginação limita o volume e calcula intervalos sem sobreposição',()=>{
 expect(paginacao('http://x?pagina=2&limite=20')).toEqual({pagina:2,limite:20,inicio:20,fim:39})
 for(const q of ['limite=101','pagina=-1','pagina=1.5','pagina=NaN','pagina=0'])expect(()=>paginacao('http://x?'+q)).toThrow()
})
