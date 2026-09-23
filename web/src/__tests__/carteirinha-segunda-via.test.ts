import {buscarPessoasClube} from '@/lib/busca-pessoas-clube'
import {consultarPortariaClube} from '@/lib/portaria-clube'
import {buscarPiscina} from '@/lib/portaria-piscina'
import {buscarAcademia} from '@/lib/portaria-academia'
const id='12345678-1234-4234-8234-123456789abc'
const novo='SOCIO-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
function banco():any {
 const socio={id,nome:'Associado',numero_titulo:'123',qr_code:novo,status:'ativo'}
 return {from:(table:string)=>{
 const filtros:any[]=[]
 const rows=()=>table==='associados'&&filtros.every(([k,v])=>(socio as any)[k]===v)?[socio]:[]
 const q:any={select:()=>q,eq:(k:string,v:any)=>{filtros.push([k,v]);return q},ilike:()=>{filtros.push(['nome','não corresponde']);return q},limit:()=>q,in:()=>q,order:()=>q,lt:()=>q,
 maybeSingle:async()=>({data:rows()[0]||null,error:null}),
 then:(resolve:any)=>Promise.resolve({data:rows(),error:null}).then(resolve)}
 return q
 }}
}
test.each(['SOCIO-'+id,'SOCIO-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',id])('código anterior %s não identifica associado após substituição',async antigo=>{
 expect(await buscarPessoasClube(banco(),antigo)).toEqual([])
 expect((await consultarPortariaClube(banco(),{tipo:'leitor',valor:antigo})).autorizado).toBe(false)
 expect(await buscarPiscina(banco(),antigo)).toHaveProperty('error')
 expect(await buscarAcademia(banco(),antigo)).toHaveProperty('error')
})
test('novo código identifica o associado para as validações de acesso',async()=>{
 expect(await buscarPessoasClube(banco(),novo)).toEqual([expect.objectContaining({id,qr_code:novo})])
})
