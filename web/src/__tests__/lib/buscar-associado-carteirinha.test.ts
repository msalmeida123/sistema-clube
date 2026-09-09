import { buscarAssociadoPorCarteirinha } from '@/lib/buscar-associado-carteirinha'
const id = '10000000-0000-4000-8000-000000000011'
function cliente(...respostas: any[]) {
  const eq=jest.fn()
  const maybeSingle=jest.fn()
  respostas.forEach(r=>maybeSingle.mockResolvedValueOnce(r))
  const query={select:jest.fn().mockReturnThis(),eq,maybeSingle}
  eq.mockReturnValue(query)
  const from=jest.fn().mockReturnValue(query)
  return {client:{from} as any,eq,from}
}
test('QR cadastrado retorna a pessoa exata',async()=>{
 const {client,eq}=cliente({data:{id,qr_code:'SOCIO-TESTE-990001'},error:null})
 expect((await buscarAssociadoPorCarteirinha(client,' SOCIO-TESTE-990001\r\n'))?.id).toBe(id)
 expect(eq).toHaveBeenCalledWith('qr_code','SOCIO-TESTE-990001')
})
test('fallback estável só aceita cadastro sem QR definido',async()=>{
 const {client}=cliente({data:null},{data:{id,qr_code:null}})
 expect((await buscarAssociadoPorCarteirinha(client,'SOCIO-'+id))?.id).toBe(id)
})
test('QR substituído não pode ser contornado pelo UUID',async()=>{
 const {client}=cliente({data:null},{data:{id,qr_code:'SOCIO-NOVO'}})
 expect(await buscarAssociadoPorCarteirinha(client,'SOCIO-'+id)).toBeNull()
})
test('QR desconhecido não vira consulta de CPF ou título',async()=>{
 const {client,from}=cliente({data:null})
 expect(await buscarAssociadoPorCarteirinha(client,'desconhecido990001')).toBeNull()
 expect(from).toHaveBeenCalledTimes(1)
})
test('falha de consulta não é tratada como pessoa encontrada',async()=>{
 const erro=new Error('indisponível');const {client}=cliente({error:erro})
 await expect(buscarAssociadoPorCarteirinha(client,'SOCIO-TESTE')).rejects.toThrow('indisponível')
})
