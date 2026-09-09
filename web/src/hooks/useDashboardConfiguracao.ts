'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buscarUsuarioAtual } from '@/lib/usuario-atual'
import { PainelDashboard, paineisPermitidos } from '@/lib/dashboard-visibilidade'

export function useDashboardConfiguracao() {
 const [paineis,setPaineis]=useState<PainelDashboard[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState(false)
 useEffect(()=>{
  let ativo=true
  const db=createClient()
  async function carregar(){
   try {
    const {data:{user},error:authError}=await db.auth.getUser()
    if(authError || !user) throw new Error('Sessão indisponível')
    const [usuario,config]=await Promise.all([
     buscarUsuarioAtual<{ativo:boolean;is_admin:boolean;permissoes:string[]}>(db,user.id,'ativo,is_admin,permissoes'),
     db.from('dashboard_config').select('paineis').eq('id',true).single()
    ])
    if(config.error || !usuario?.ativo) throw new Error('Configuração indisponível')
    if(ativo) setPaineis(paineisPermitidos(config.data.paineis,usuario.permissoes||[],usuario.is_admin))
   }catch {if(ativo){setPaineis([]);setError(true)}}
   finally {if(ativo)setLoading(false)}
  }
  void carregar()
  return ()=>{ativo=false}
 },[])
 return {paineis,loading,error}
}
