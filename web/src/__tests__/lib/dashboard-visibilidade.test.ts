import {PAINEIS_DASHBOARD,paineisPermitidos} from '@/lib/dashboard-visibilidade'
const todos=PAINEIS_DASHBOARD.map(p=>p.id)
test('Usuário CRM não recebe indicadores do clube ou financeiro',()=>{
 expect(paineisPermitidos(todos,['dashboard','crm'],false)).toEqual(['conversas','alertas','setores','metricas'])
})
test('Administrador também respeita a configuração da empresa',()=>{
 expect(paineisPermitidos(['conversas','metricas'],[],true)).toEqual(['conversas','metricas'])
})
test('Seleção vazia não restaura todos implicitamente',()=>{
 expect(paineisPermitidos([],todos,true)).toEqual([])
})
test('Permissão individual não habilita painel desativado',()=>{
 expect(paineisPermitidos(['financeiro'],['crm'],false)).toEqual([])
})
