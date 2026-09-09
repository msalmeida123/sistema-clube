import {buscarPessoasClube,correspondeDependente} from '@/lib/busca-pessoas-clube'
function client(respostas:any[]) {
 const queries:any[]=[]
 return {queries,db:{from:jest.fn((table:string)=>{
 const q:any={table};for(const method of ['select','eq','in','ilike','limit']) q[method]=jest.fn(()=>q)
 q.then=(ok:any,bad:any)=>Promise.resolve(respostas.shift()).then(ok,bad);queries.push(q);return q
 })} as any}
}
test('título preserva zeros e retorna titular e todos os dependentes',async()=>{
 const {db,queries}=client([{data:[]},{data:[]},{data:[{id:'a',numero_titulo:'000123'}]},{data:[{id:'d1'},{id:'d2'}]}])
 const rows=await buscarPessoasClube(db,'000123',true)
 expect(rows.map(p=>p.tipo)).toEqual(['associado','dependente','dependente'])
 expect(queries[2].eq).toHaveBeenCalledWith('numero_titulo','000123')
 expect(queries[3].in).toHaveBeenCalledWith('associado_id',['a'])
})
test('QR exato não consulta título',async()=>{
 const {db,queries}=client([{data:[{id:'a'}]}]);expect(await buscarPessoasClube(db,'SOCIO-TESTE')).toHaveLength(1);expect(queries).toHaveLength(1)
})
test('código desconhecido com prefixo não é buscado por trecho',async()=>{
 const {db,queries}=client([{data:[]}]);expect(await buscarPessoasClube(db,'SOCIO-123')).toEqual([]);expect(queries).toHaveLength(1)
})
test('erro de banco não vira lista vazia',async()=>{
 const {db}=client([{error:new Error('offline')}]);await expect(buscarPessoasClube(db,'123')).rejects.toThrow('offline')
})
test('filtro de dependentes usa título do titular sem busca parcial',()=>{
 const d={nome:'Ana',associado:{nome:'Maria',numero_titulo:'000123'}}
 expect(correspondeDependente(d,'000123')).toBe(true)
 expect(correspondeDependente(d,'123')).toBe(false)
 expect(correspondeDependente(d,'Maria')).toBe(true)
})
