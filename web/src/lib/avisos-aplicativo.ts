import {z} from 'zod'
export const tempoAvisosSchema=z.object({tempo_segundos:z.number().int().min(0).max(60)}).strict()
export const avisoId=z.string().uuid()
export const novoAvisoSchema=z.object({id:avisoId,titulo:z.string().trim().min(3).max(120),descricao:z.string().trim().max(2000),validade:z.string().refine(v=>!v||/^\d{4}-\d{2}-\d{2}$/.test(v),'Data inválida')}).strict()
export const acaoAvisoSchema=z.object({id:avisoId,acao:z.enum(['publicar','pausar'])}).strict()
export function expiraAviso(data:string){
 if(!data)return null
 const parsed=new Date(data+'T12:00:00Z')
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==data)throw new Error('Data inválida')
 return data+'T23:59:59-03:00'
}
export function avisoDisponivel(a:{ativo:boolean;expira_em:string|null},agora=Date.now()){return a.ativo&&(!a.expira_em||Date.parse(a.expira_em)>agora)}
export type AvisoAplicativo={id:string;titulo:string;descricao:string;expira_em:string|null;publicado_em:string|null;fechado?:boolean;ativo?:boolean;criado_em?:string}
