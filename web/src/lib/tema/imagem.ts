import sharp from 'sharp'
import {randomUUID} from 'node:crypto'
import {MAX_ICONE,tiposIcone,tamanhos} from './modelo'
export async function prepararIcone(file:File){
 if(!tiposIcone.includes(file.type)||file.size>MAX_ICONE||!file.size)throw new Error('IMAGEM')
 const input=Buffer.from(await file.arrayBuffer())
 const png=input.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpeg=input[0]===255&&input[1]===216&&input[2]===255,webp=input.toString('ascii',0,4)==='RIFF'&&input.toString('ascii',8,12)==='WEBP'
 if(!(file.type==='image/png'&&png||file.type==='image/jpeg'&&jpeg||file.type==='image/webp'&&webp))throw new Error('IMAGEM')
 const image=sharp(input,{limitInputPixels:4096*4096,failOn:'warning'}),meta=await image.metadata()
 if(!meta.width||!meta.height||meta.width<192||meta.height<192||meta.width>4096||meta.height>4096||(meta.pages??1)>1)throw new Error('IMAGEM')
 const id=randomUUID(),result:Record<string,{nome:string,dados:string}>={}
 for(const size of tamanhos){const data=await image.clone().rotate().resize(size,size,{fit:'contain',background:{r:255,g:255,b:255,alpha:0}}).png().toBuffer();result[`s${size}`]={nome:`${id}-${size}.png`,dados:data.toString('base64')}}
 return result
}
export const iconePadrao=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#103f35"/><path d="M256 90l130 54v112c0 86-58 140-130 166-72-26-130-80-130-166V144z" fill="none" stroke="white" stroke-width="26"/><path d="M192 251l45 45 85-91" fill="none" stroke="white" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/></svg>')
