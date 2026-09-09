import type {FolhaPagamento} from './types'
export const CAMPOS_RUBRICA = [
 ['salario_base','Salário','vencimento'],['horas_extras_valor','Horas extras','vencimento'],['adicional_noturno','Adicional noturno','vencimento'],['adicional_insalubridade','Insalubridade','vencimento'],['adicional_periculosidade','Periculosidade','vencimento'],['gratificacao','Gratificação','vencimento'],['comissao','Comissão','vencimento'],['outros_proventos','Outros vencimentos','vencimento'],
 ['inss','INSS','desconto'],['irrf','IRRF','desconto'],['vale_transporte','Vale-transporte','desconto'],['vale_refeicao','Vale-refeição / alimentação','desconto'],['faltas_desconto','Faltas','desconto'],['atrasos_desconto','Atrasos','desconto'],['adiantamento','Adiantamento salarial','desconto'],['outros_descontos','Outros descontos','desconto'],
] as const
export type CampoRubrica=typeof CAMPOS_RUBRICA[number][0]
export type Rubrica={campo:CampoRubrica;codigo:string;descricao:string;referencia:string;valor:number}
export type DetalhesHolerite={codigo_funcionario:string;sede:string;admissao:string;conta:string;dependentes:number|null;base_inss:number|null;base_irrf:number|null;base_fgts:number|null;salario_contratual:number|null;rubricas:Rubrica[]}
export const ehVencimento=(r:Rubrica)=>CAMPOS_RUBRICA.find(c=>c[0]===r.campo)?.[2]==='vencimento'
export function detalhesHolerite(f:FolhaPagamento):DetalhesHolerite{
 if(f.detalhes_holerite)return f.detalhes_holerite
 return {codigo_funcionario:'',sede:'',admissao:f.funcionario?.data_admissao||'',conta:[f.funcionario?.banco,f.funcionario?.agencia,f.funcionario?.conta].filter(Boolean).join(' / '),dependentes:null,base_inss:null,base_irrf:null,base_fgts:null,salario_contratual:f.salario_base??null,
  rubricas:CAMPOS_RUBRICA.filter(([campo])=>Number(f[campo])!==0&&f[campo]!=null).map(([campo,descricao])=>({campo,codigo:'',descricao,referencia:'',valor:Number(f[campo])}))}
}
