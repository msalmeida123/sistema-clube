import {carregarDadosDashboard} from '@/hooks/useDashboardData'
import * as views from '@/lib/supabase-views'
jest.mock('@/lib/supabase-views',()=>({
 getKPIs:jest.fn().mockResolvedValue({}),getAlertasConversas:jest.fn().mockResolvedValue([]),
 getConversasPorSetor:jest.fn().mockResolvedValue([]),getDashboardFinanceiro:jest.fn().mockResolvedValue(null),
 getDashboardConversas:jest.fn().mockResolvedValue(null),getMetricasPorHora:jest.fn().mockResolvedValue([])
}))
beforeEach(()=>jest.clearAllMocks())
test('CRM não consulta dados de clube e financeiro',async()=>{
 await carregarDadosDashboard(['conversas','alertas','setores','metricas'])
 expect(views.getKPIs).toHaveBeenCalledWith('conversas_abertas')
 expect(views.getDashboardFinanceiro).not.toHaveBeenCalled()
 expect(views.getDashboardConversas).toHaveBeenCalledTimes(1)
})
test('Painel vazio não consulta métricas',async()=>{
 await carregarDadosDashboard([])
 for(const fn of Object.values(views).filter(fn=>typeof fn==='function')) expect(fn).not.toHaveBeenCalled()
})
