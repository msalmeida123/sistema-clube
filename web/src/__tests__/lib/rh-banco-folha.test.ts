import {RHService} from '@/modules/rh/services/rh.service'
import {ENCARGOS_2026,calcularEncargos} from '@/modules/rh/encargos'
const mockRpc=jest.fn()
jest.mock('@/lib/supabase/client',()=>({createClient:()=>({rpc:mockRpc})}))
test('geração inclui saldo vencido nos vencimentos, bases e dados impressos',async()=>{
 const banco={campo:'horas_extras_valor',codigo:'BH1',descricao:'Banco de horas vencido - adicional 50%',referencia:'120 min',valor:30,incidencias:{inss:true,irrf:true,fgts:true},banco_ids:['credito-teste']}
 mockRpc.mockResolvedValue({data:[banco],error:null})
 const anterior=global.fetch;global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({config:{parametros:ENCARGOS_2026}})})
 const repo:any={findAllFuncionarios:jest.fn().mockResolvedValue([{id:'func',salario:2200}]),findAllFolhas:jest.fn().mockResolvedValue([]),createFolha:jest.fn().mockImplementation(async d=>d)}
 try{const [folha]=await new RHService(repo).gerarFolhaMensal('2026-09');expect(folha.horas_extras_valor).toBe(30);expect(folha.total_proventos).toBe(2230);expect(folha.detalhes_holerite?.base_fgts).toBe(2230);expect(folha.detalhes_holerite?.rubricas).toContainEqual(banco);expect(folha.salario_liquido).toBeCloseTo(2230-folha.inss-folha.irrf,2)}finally{global.fetch=anterior}
})
