'use client'
import {useDashboardConfiguracao} from '@/hooks/useDashboardConfiguracao'
import {useDashboardData} from '@/hooks/useDashboardData'
import {KPICards} from '@/components/dashboard/KPICards'
import {AlertasConversas} from '@/components/dashboard/AlertasConversas'
import {ConversasPorSetor} from '@/components/dashboard/ConversasPorSetor'
import {ResumoFinanceiro} from '@/components/dashboard/ResumoFinanceiro'
import {MetricasWhatsApp} from '@/components/dashboard/MetricasWhatsApp'
export default function DashboardPage(){
 const config=useDashboardConfiguracao()
 const {data,loading}=useDashboardData(config.paineis,config.loading)
 if(config.loading)return <p className="text-muted-foreground">Carregando Dashboard...</p>
 if(config.error)return <p role="alert">Não foi possível carregar as permissões do Dashboard. Recarregue a página.</p>
 if(!config.paineis.length)return <p className="text-muted-foreground">Nenhum indicador está habilitado para você no Dashboard desta empresa.</p>
 const tem=(id:typeof config.paineis[number])=>config.paineis.includes(id)
 return <div className="space-y-6">
  <KPICards kpis={data.kpis} loading={loading} paineis={config.paineis}/>
  <div className="grid gap-4 md:grid-cols-2">
   {tem('alertas')&&<AlertasConversas alertas={data.alertas} loading={loading}/>}
   {tem('setores')&&<ConversasPorSetor setores={data.setores} loading={loading}/>}
   {tem('financeiro')&&<ResumoFinanceiro financeiro={data.financeiro} loading={loading}/>}
   {tem('metricas')&&<MetricasWhatsApp conversas={data.conversas} metricas={data.metricasHora} loading={loading}/>}
  </div>
 </div>
}
