import {dadosSetor,lerRegistrosRelatorio} from '@/lib/relatorios-setores-servidor'
function banco(linhas:any[]=[]){const consultas:any[]=[];const db={from:jest.fn((table:string)=>{const item:any={table,filtros:[]};consultas.push(item);const q:any={select:(s:string)=>{item.select=s;return q},eq:(k:string,v:string)=>{item.filtros.push([k,v]);return q},order:()=>q,gte:()=>q,lte:()=>q,range:()=>q,then:(resolve:any)=>Promise.resolve({data:linhas,error:null}).then(resolve)};return q})};return {db,consultas}}
test('associados e dependentes sempre limitados ao clube da sessão',async()=>{const {db,consultas}=banco();await dadosSetor(db,'clube-A','associados','','');expect(consultas[0].filtros).toContainEqual(['clube_id','clube-A']);expect(consultas[1].select).toContain('!inner');expect(consultas[1].filtros).toContainEqual(['associado.clube_id','clube-A'])})
test.each(['piscina','academia','sauna','convites','portaria'])('setor %s filtra todas as consultas e relações por tenant',async setor=>{const {db,consultas}=banco();await dadosSetor(db,'clube-B',setor,'inicio','fim');for(const c of consultas){expect(c.filtros.some((f:any)=>f[0].endsWith('clube_id')&&f[1]==='clube-B')).toBe(true)}})
test('não converte falha SQL em relatório vazio',async()=>{const q:any={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({data:null,error:Error('banco')})};await expect(lerRegistrosRelatorio({from:()=>q},'associados','*','clube_id','A')).rejects.toThrow('banco')})
test('paginação percorre mais de uma página do servidor',async()=>{let n=0;const q:any={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({data:n++===0?Array(500).fill({id:'a'}):[{id:'b'}]})};expect(await lerRegistrosRelatorio({from:()=>q},'associados','*','clube_id','A')).toHaveLength(501)})

test.each(['individual','familiar','patrimonial'])('usa o plano %s armazenado no associado sem relacionamento inexistente',async plano=>{
 const {db,consultas}=banco([{id:'a',plano}])
 const resultado=await dadosSetor(db,'clube-A','associados','','')
 expect(consultas[0].select).toBe('*')
 expect(resultado.associados[0].plano.tipo).toBe(plano)
 expect(resultado.associados[0].plano.nome.toLowerCase()).toBe(plano)
})
