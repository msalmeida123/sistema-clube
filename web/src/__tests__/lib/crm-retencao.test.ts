import { arquivarLote } from '../../../workers/retencao'
function banco(falha?: string) {
 let arquivo: Buffer
 const rpc=jest.fn().mockResolvedValueOnce({data:[{mensagem:{id:'teste'},fila:null}]}).mockResolvedValue({data:1})
 const bucket={upload:jest.fn(async (_:string,b:Buffer)=>{arquivo=b;return {error:falha==='upload'?new Error():null}}),download:jest.fn(async()=>({data:{arrayBuffer:async()=>falha==='checksum'?Buffer.from('inválido'):arquivo},error:falha==='download'?new Error():null}))}
 return {rpc,storage:{from:()=>bucket}}
}
test.each(['upload','download','checksum'])('Não remove se falhar %s',async falha=>{
 const db=banco(falha)
 await expect(arquivarLote(db as any)).rejects.toThrow()
 expect(db.rpc).toHaveBeenCalledTimes(1)
})
test('Confirma exclusão somente depois de verificar o arquivo',async()=>{
 const db=banco()
 expect(await arquivarLote(db as any)).toBe(1)
 expect(db.rpc.mock.calls[1][0]).toBe('crm_confirmar_arquivo')
})
