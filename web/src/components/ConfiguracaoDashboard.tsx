'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {PAINEIS_DASHBOARD} from '@/lib/dashboard-visibilidade'
import {Button} from '@/components/ui/button'
import {Card,CardHeader,CardTitle,CardContent} from '@/components/ui/card'
import {toast} from 'sonner'

export default function ConfiguracaoDashboard(){
 const [paineis,setPaineis]=useState<string[]>([])
 const [loading,setLoading]=useState(true)
 const [erro,setErro]=useState(false)
 const [salvando,setSalvando]=useState(false)
 const db=createClient()
 useEffect(()=>{let ativo=true;void db.from('dashboard_config').select('paineis').eq('id',true).single().then(({data,error})=>{
  if(!ativo)return
  if(error){setErro(true);toast.error('Não foi possível carregar a configuração do Dashboard')}
  else setPaineis(data.paineis)
  setLoading(false)
 });return()=>{ativo=false}},[db])
 async function salvar(){
  setSalvando(true)
  try {
   const {data,error}=await db.from('dashboard_config').update({paineis}).eq('id',true).select('id').single()
   if(error||!data)throw new Error()
   toast.success('Dashboard da empresa atualizado. Reabra o Dashboard para ver as alterações.')
  }catch{toast.error('Não foi possível salvar. Somente administradores podem alterar esta configuração.')}
  finally{setSalvando(false)}
 }
 return <Card><CardHeader><CardTitle>Dashboard da empresa</CardTitle><p className="text-sm text-muted-foreground">Escolha os indicadores que aparecem no painel inicial de todos os usuários desta instalação. As permissões individuais também são respeitadas. Esta escolha não altera o acesso aos módulos do menu.</p></CardHeader><CardContent className="space-y-6">
  {loading?<p>Carregando...</p>:erro?<p>Configuração indisponível. Recarregue a página para tentar novamente.</p>:<>
   <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setPaineis(PAINEIS_DASHBOARD.filter(p=>p.grupo==='CRM').map(p=>p.id))}>Somente CRM</Button><Button variant="outline" onClick={()=>setPaineis(PAINEIS_DASHBOARD.map(p=>p.id))}>Todos os indicadores</Button><Button variant="outline" onClick={()=>setPaineis([])}>Desmarcar todos</Button></div>
   <div className="grid gap-6 md:grid-cols-3">{['Clube','Financeiro','CRM'].map(grupo=><fieldset key={grupo} className="space-y-3"><legend className="font-semibold mb-3">{grupo}</legend>{PAINEIS_DASHBOARD.filter(p=>p.grupo===grupo).map(p=><label key={p.id} className="flex gap-2 items-center text-sm"><input type="checkbox" checked={paineis.includes(p.id)} onChange={e=>setPaineis(prev=>e.target.checked?[...prev,p.id]:prev.filter(id=>id!==p.id))}/>{p.nome}</label>)}</fieldset>)}</div>
   {!paineis.length&&<p className="text-sm text-muted-foreground">Nenhum indicador aparecerá no Dashboard.</p>}
   <Button onClick={salvar} disabled={salvando}>{salvando?'Salvando...':'Salvar Dashboard da empresa'}</Button>
  </>}
 </CardContent></Card>
}
