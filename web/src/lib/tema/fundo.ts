import sharp from 'sharp'
export const MAX_FUNDO = 8 * 1024 * 1024
/** Decodifica e reencoda a imagem: remove metadados e limita memória e tamanho final. */
export async function prepararFundo(file: File) {
 if (!['image/jpeg','image/png','image/webp'].includes(file.type) || !file.size || file.size > MAX_FUNDO) throw new Error('IMAGEM')
 const imagem = sharp(Buffer.from(await file.arrayBuffer()), {limitInputPixels:32000000, failOn:'warning'})
 const meta = await imagem.metadata()
 const formatos:Record<string,string> = {'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'}
 if (meta.format !== formatos[file.type] || !meta.width || !meta.height || meta.width < 320 || meta.height < 320 || (meta.pages ?? 1) > 1) throw new Error('IMAGEM')
 const buf = await imagem.rotate().resize({width:2560,height:2560,fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer()
 if (buf.length > 2 * 1024 * 1024) throw new Error('IMAGEM')
 return buf.toString('base64')
}
