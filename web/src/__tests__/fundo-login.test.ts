import sharp from 'sharp'
import {File} from 'node:buffer'
import {prepararFundo,MAX_FUNDO} from '@/lib/tema/fundo'
const file=(buffer:Buffer,type='image/png')=>new File([new Uint8Array(buffer)],'fundo.png',{type}) as unknown as globalThis.File
it('redimensiona sem distorcer, remove metadados e converte em WebP',async()=>{
 const input=await sharp({create:{width:3840,height:2160,channels:3,background:'#103f35'}}).withMetadata().png().toBuffer()
 const out=Buffer.from(await prepararFundo(file(input)),'base64');const m=await sharp(out).metadata()
 expect(m.format).toBe('webp');expect(m.width).toBe(2560);expect(m.height).toBe(1440);expect(m.exif).toBeUndefined()
})
it('rejeita conteúdo inválido ou MIME adulterado',async()=>{
 await expect(prepararFundo(file(Buffer.from('<svg/>')))).rejects.toThrow()
 const png=await sharp({create:{width:320,height:320,channels:3,background:'white'}}).png().toBuffer()
 await expect(prepararFundo(file(png,'image/jpeg'))).rejects.toThrow()
})
it('rejeita imagens pequenas e arquivos acima do limite',async()=>{
 const small=await sharp({create:{width:10,height:10,channels:3,background:'white'}}).png().toBuffer()
 await expect(prepararFundo(file(small))).rejects.toThrow()
 await expect(prepararFundo(file(Buffer.alloc(MAX_FUNDO+1)))).rejects.toThrow()
})
