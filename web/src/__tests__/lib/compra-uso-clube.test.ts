import {compraUsoSchema,tipoAnexo,totalCompraCentavos} from '@/lib/compra-uso-clube'
test('valida datas, valores e arredondamento de quantidades fracionadas',()=>{
 const d={fornecedor:'Loja',nota_numero:'123',data_nota:'2026-09-10',data_pagamento:'2026-09-10',categoria:'limpeza',forma_pagamento:'pix',itens:[{produto:'Produto',quantidade:1.005,valor_unitario:1}]}
 expect(compraUsoSchema.safeParse(d).success).toBe(true)
 expect(totalCompraCentavos(d.itens)).toBe(101)
 expect(compraUsoSchema.safeParse({...d,data_nota:'2026-02-30'}).success).toBe(false)
 expect(compraUsoSchema.safeParse({...d,itens:[{produto:'Produto',quantidade:-1,valor_unitario:10}]}).success).toBe(false)
})
test('aceita assinaturas de PDF e imagem, recusa conteúdo HTML',()=>{
 expect(tipoAnexo(Buffer.from('%PDF-1.4')).mime).toBe('application/pdf')
 expect(tipoAnexo(Buffer.from([255,216,255,224])).mime).toBe('image/jpeg')
 expect(()=>tipoAnexo(Buffer.from('<html>arquivo</html>'))).toThrow()
})
