import {NextResponse} from 'next/server'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {z} from 'zod'
export const dynamic='force-dynamic'
const enderecoSchema=z.object({logradouro:z.string(),bairro:z.string(),localidade:z.string().min(1),uf:z.string().regex(/^[A-Z]{2}$/),ibge:z.string().optional()})
export async function GET(_req:Request,{params}:{params:Promise<{cep:string}>}) {
 if(!await acessoRota()) return NextResponse.json({error:'Entre novamente no sistema.'},{status:401})
 const {cep}=await params
 if(!/^\d{8}$/.test(cep)) return NextResponse.json({error:'Informe um CEP com 8 dígitos.'},{status:400})
 try {
  const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`,{signal:AbortSignal.timeout(8000),redirect:'error',next:{revalidate:86400}})
  if(!response.ok) throw Error('provider')
  const body=await response.json()
  if(body.erro) return NextResponse.json({error:'CEP não encontrado. Confira o número ou preencha o endereço manualmente.'},{status:404})
  const data=enderecoSchema.parse(body)
  return NextResponse.json({endereco:data.logradouro,bairro:data.bairro,cidade:data.localidade,estado:data.uf,ibge:data.ibge||''})
 } catch {
  return NextResponse.json({error:'Consulta de CEP indisponível. Você pode preencher o endereço manualmente.'},{status:502})
 }
}
