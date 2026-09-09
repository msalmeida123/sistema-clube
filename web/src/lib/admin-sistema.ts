import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs'
import {cookies} from 'next/headers'
import {verificarPermissao} from './usuario-atual'
export async function adminSistema(){
 const db=createRouteHandlerClient({cookies});const {data:{user}}=await db.auth.getUser()
 if(!user)return {status:401 as const}
 const p=await verificarPermissao(db,user.id,'configuracoes')
 if(!p.isAdmin)return {status:403 as const}
 return {status:200 as const,db,user}
}
