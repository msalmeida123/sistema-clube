const result: {data:unknown;error:unknown}={data:null,error:null}
const query:any={select:()=>query,single:async()=>result,in:()=>query,order:()=>query,limit:async()=>result,then:(resolve:any)=>Promise.resolve(result).then(resolve)}
jest.mock('@/lib/supabase',()=>({supabase:{from:()=>query}}))
import {getKPIs,getDashboardConversas,getAlertasConversas,getConversasPorSetor,getDashboardFinanceiro,getMetricasPorHora} from '@/lib/supabase-views'
const readers=[getKPIs,getDashboardConversas,getAlertasConversas,getConversasPorSetor,getDashboardFinanceiro,getMetricasPorHora]
beforeEach(()=>{result.data=null;result.error=null;jest.spyOn(console,'error').mockImplementation(()=>{})})
afterEach(()=>jest.restoreAllMocks())
test.each(readers)('falha de consulta não vira zero ou lista vazia (%#)',async(read)=>{result.error={code:'42P01',message:'missing view'};await expect(read()).rejects.toThrow('indicadores')})
test('zero real continua válido',async()=>{result.data={associados_ativos:0};await expect(getKPIs()).resolves.toEqual({associados_ativos:0})})
