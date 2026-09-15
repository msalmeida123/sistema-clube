import {cookies} from 'next/headers'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {buscarUsuarioAtual} from '@/lib/usuario-atual'
import {fetchInterno} from './fetch-interno'

/** Revalida sessão e acesso em cada requisição, sem cache entre usuários. */
export async function acessoRota(modulo?: string, acao = 'visualizar') {
  const auth = await createRouteHandlerClient({cookies}, {options:{global:{fetch:fetchInterno}}})
  const {data:{user},error} = await auth.auth.getUser()
  if(error || !user) return null
  const usuario = await buscarUsuarioAtual<{ativo:boolean,is_admin:boolean}>(auth,user.id,'ativo,is_admin')
  if(usuario?.ativo !== true) return null
  if(modulo) {
    const {data,error} = await auth.rpc('sistema_pode',{codigo:modulo,acao})
    if(error || data !== true) return null
  }
  return {user,admin:usuario.is_admin === true}
}
