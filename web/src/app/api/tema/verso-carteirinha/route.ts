import {NextRequest} from 'next/server'
import {clubeTema,erroTema} from '@/lib/tema/servidor'
import {appDb} from '@/lib/associado-app'
export const runtime='nodejs'
export const dynamic='force-dynamic'
/** A imagem do login é pública, mas sempre limitada ao clube do domínio acessado. */
export async function GET(req:NextRequest){try{
 const clube=await clubeTema(req)
 const {data,error}=await appDb().from('clube_verso_carteirinha').select('dados,versao').eq('clube_id',clube).maybeSingle()
 if(error)throw error
 const headers={'Cache-Control':'private, no-cache','Vary':'Cookie, Host','X-Content-Type-Options':'nosniff'}
 if(!data)return new Response(null,{status:204,headers})
 const etag=`"${data.versao}"`
 if(req.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers:{...headers,ETag:etag}})
 return new Response(new Uint8Array(Buffer.from(data.dados,'base64')),{headers:{...headers,ETag:etag,'Content-Type':'image/webp'}})
}catch(e){return erroTema(e)}}
