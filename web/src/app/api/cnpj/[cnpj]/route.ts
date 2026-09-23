import {consultarProvedorCnpj} from '@/lib/provedor-cnpj'
import {NextResponse} from 'next/server'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {CacheMemoria} from '@/lib/cache-memoria'
import {cnpjValido,normalizarCnpj} from '@/lib/cnpj'
export const dynamic='force-dynamic'
const cache=new CacheMemoria<object>(3600000,500)
export async function GET(_req:Request,{params}:{params:Promise<{cnpj:string}>}){
 let acesso
 try{acesso=await acessoRota('associados')}catch{return NextResponse.json({error:'Não foi possível verificar sua sessão. Entre novamente e tente consultar o CNPJ.'},{status:503})}
 if(!acesso)return NextResponse.json({error:'Sem permissão para consultar empresas.'},{status:403})
 const cnpj=normalizarCnpj((await params).cnpj)
 if(!cnpjValido(cnpj))return NextResponse.json({error:'CNPJ inválido. Confira os caracteres e os dígitos verificadores.'},{status:400})
 try{
  const empresa=await cache.obter(cnpj,async()=>{
   const d=await consultarProvedorCnpj(cnpj)
   const texto=(k:string,max=200)=>typeof d[k]==='string'?d[k].trim().slice(0,max):''
   return {cnpj,nome:texto('razao_social'),nome_fantasia:texto('nome_fantasia'),cep:texto('cep',10),endereco:[texto('descricao_tipo_de_logradouro'),texto('logradouro')].filter(Boolean).join(' ').slice(0,200),numero:texto('numero',20),complemento:texto('complemento',100),bairro:texto('bairro',100),cidade:texto('municipio',100),estado:texto('uf',2),situacao:texto('descricao_situacao_cadastral')}
  })
  return NextResponse.json(empresa,{headers:{'Cache-Control':'no-store'}})
 }catch(e){return NextResponse.json({error:e instanceof Error&&e.message==='nao_encontrado'?'Empresa não encontrada na base de consulta. Confira o CNPJ ou preencha os dados manualmente.':'Consulta indisponível. Tente novamente ou preencha os dados manualmente.'},{status:e instanceof Error&&e.message==='nao_encontrado'?404:502})}
}
