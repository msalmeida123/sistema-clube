import {z} from 'zod'
import {CAMPOS_RUBRICA,DetalhesHolerite,ehVencimento} from './holerite'
const dinheiro=z.number().finite().min(0).max(99999999.99)
const percentual=z.number().finite().min(0).max(100)
const mes=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
export const schemaEncargos=z.object({
 inicio:mes,fim:mes,fgts:percentual,dependente:dinheiro,simplificado:dinheiro,
 inss:z.array(z.object({ate:dinheiro,aliquota:percentual})).min(1).max(10),
 irrf:z.array(z.object({ate:dinheiro.nullable(),aliquota:percentual,deducao:dinheiro})).min(1).max(10),
 reducao:z.object({ativa:z.boolean(),isencao:dinheiro,limite:dinheiro,fixa:dinheiro,fator:z.number().finite().min(0).max(1)}),
}).superRefine((p,c)=>{
 if(p.fim<p.inicio)c.addIssue({code:'custom',message:'Vigência final anterior à inicial'})
 for(const [nome,faixas] of [['INSS',p.inss],['IRRF',p.irrf]] as const){let anterior=0;faixas.forEach((f,i)=>{if(f.ate===null){if(nome!=='IRRF'||i!==faixas.length-1)c.addIssue({code:'custom',message:'Apenas a última faixa de IRRF pode ficar sem limite'})}else if(f.ate<=anterior)c.addIssue({code:'custom',message:'Limites de '+nome+' devem ser crescentes'});anterior=f.ate??Infinity})}
 if(p.irrf[p.irrf.length-1].ate!==null)c.addIssue({code:'custom',message:'A última faixa de IRRF deve ficar sem limite'})
 if(p.reducao.limite<=p.reducao.isencao)c.addIssue({code:'custom',message:'Limites da redução inválidos'})
})
export type ParametrosEncargos=z.infer<typeof schemaEncargos>
// Fontes e escopo documentados em deploy/supabase-local/RH-ENCARGOS.md.
export const ENCARGOS_2026:ParametrosEncargos={inicio:'2026-01',fim:'2026-12',fgts:8,dependente:189.59,simplificado:607.2,inss:[{ate:1621,aliquota:7.5},{ate:2902.84,aliquota:9},{ate:4354.27,aliquota:12},{ate:8475.55,aliquota:14}],irrf:[{ate:2428.8,aliquota:0,deducao:0},{ate:2826.65,aliquota:7.5,deducao:182.16},{ate:3751.05,aliquota:15,deducao:394.16},{ate:4664.68,aliquota:22.5,deducao:675.49},{ate:null,aliquota:27.5,deducao:908.73}],reducao:{ativa:true,isencao:5000,limite:7350,fixa:978.62,fator:0.133145}}
export const centavos=(v:number)=>Math.round((v+Number.EPSILON)*100)/100
export function calcularEncargos(d:DetalhesHolerite,config:ParametrosEncargos,referencia:string):DetalhesHolerite{
 const p=schemaEncargos.parse(config)
 const mesIR=d.mes_irrf||referencia
 if(!mes.safeParse(referencia).success||!mes.safeParse(mesIR).success||referencia<p.inicio||referencia>p.fim||mesIR<p.inicio||mesIR>p.fim)throw Error('Configure as tabelas para a competência e o mês do pagamento em RH → Configuração → Encargos.')
 if(!Number.isInteger(d.dependentes)||d.dependentes!<0||d.dependentes!>99)throw Error('Informe a quantidade de dependentes do IRRF, inclusive zero.')
 if(d.rubricas.length===0||d.rubricas.some(r=>!Number.isFinite(r.valor)||r.valor<0||r.valor>99999999.99))throw Error('Valores de rubricas inválidos')
 for(const r of d.rubricas.filter(r=>!['inss','irrf'].includes(r.campo)))if(!r.incidencias||!['inss','irrf','fgts'].every(k=>typeof r.incidencias?.[k as 'inss']==='boolean'))throw Error('Confira a incidência de INSS, IRRF e FGTS em todas as rubricas.')
 const base=(tipo:'inss'|'irrf'|'fgts')=>Math.max(0,centavos(d.rubricas.reduce((s,r)=>s+(!['inss','irrf'].includes(r.campo)&&r.incidencias?.[tipo]?r.valor*(ehVencimento(r)?1:-1):0),0)))
 const remuneracao=base('inss'),tributavel=base('irrf'),baseFgts=base('fgts')
 let anterior=0,inss=0
 for(const f of p.inss){inss+=Math.max(0,Math.min(remuneracao,f.ate)-anterior)*f.aliquota/100;anterior=f.ate}
 inss=centavos(inss)
 const outras=d.outras_deducoes_irrf??0;dinheiro.parse(outras)
 const legais=centavos(inss+d.dependentes!*p.dependente+outras)
 const deducao=d.regime_irrf==='legais'?legais:Math.max(legais,p.simplificado)
 const baseIR=centavos(Math.max(0,tributavel-deducao))
 const faixa=p.irrf.find(f=>f.ate===null||baseIR<=f.ate)!
 let irrf=centavos(Math.max(0,baseIR*faixa.aliquota/100-faixa.deducao))
 if(p.reducao.ativa){if(tributavel<=p.reducao.isencao)irrf=0;else if(tributavel<=p.reducao.limite)irrf=centavos(Math.max(0,irrf-Math.max(0,centavos(p.reducao.fixa-p.reducao.fator*tributavel))))}
 const aliquota=d.fgts_aliquota??p.fgts;percentual.parse(aliquota)
 const rubricas=d.rubricas.filter(r=>!['inss','irrf'].includes(r.campo)).map((r,i)=>({...r,codigo:r.codigo||String(i+1).padStart(3,'0')}))
 for(const [campo,valor]of [['inss',inss],['irrf',irrf]] as const)rubricas.push({campo,valor,codigo:campo.toUpperCase(),descricao:campo.toUpperCase(),referencia:'Mensal'})
 return {...d,mes_irrf:mesIR,base_inss:Math.min(remuneracao,p.inss[p.inss.length-1].ate),base_irrf:baseIR,base_fgts:baseFgts,fgts_aliquota:aliquota,fgts_valor:centavos(baseFgts*aliquota/100),rubricas,calculo_encargos:{parametros:p,referencia,mes_irrf:mesIR,deducao_irrf:deducao,calculado_em:new Date().toISOString()}}
}
export function incidenciasPadrao(campo:string){
 if(campo==='outros_proventos'||campo==='outros_descontos')return undefined
 const incide=CAMPOS_RUBRICA.some(c=>c[0]===campo&&c[2]==='vencimento')||['faltas_desconto','atrasos_desconto'].includes(campo)
 return {inss:incide,irrf:incide,fgts:incide}
}
