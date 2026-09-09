'use client'
import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {createClient} from '@/lib/supabase/client'
import {toast} from 'sonner'
import type {FolhaPagamento} from '../types'
import {CAMPOS_RUBRICA,detalhesHolerite,ehVencimento,Rubrica} from '../holerite'

const extras=['Contribuição sindical','Pensão alimentícia','Plano de saúde','Coparticipação médica','Assistência odontológica','Academia','Vale-alimentação']
export function HoleriteEditor({folha,onSave}:{folha:FolhaPagamento;onSave:()=>void}){
 const [dados,setDados]=useState(()=>detalhesHolerite(folha)),[obs,setObs]=useState(folha.observacao||''),[busy,setBusy]=useState(false),[extra,setExtra]=useState(extras[0])
 const podeEditar=['rascunho','calculada'].includes(folha.status)
 function rubrica(index:number,patch:Partial<Rubrica>){setDados({...dados,rubricas:dados.rubricas.map((r,i)=>i===index?{...r,...patch}:r)})}
 function adicionar(campo:Rubrica['campo'],descricao:string){if(dados.rubricas.length>=100)return;setDados({...dados,rubricas:[...dados.rubricas,{campo,descricao,codigo:'',referencia:'',valor:0}]})}
 async function salvar(e:React.FormEvent){e.preventDefault();setBusy(true);try{const {error}=await createClient().rpc('rh_salvar_holerite',{p_id:folha.id,p_versao:folha.updated_at??null,p_detalhes:dados,p_observacao:obs});if(error)throw error;toast.success('Demonstrativo e totais salvos');onSave()}catch(e:any){toast.error(e.message||'Não foi possível salvar')}finally{setBusy(false)}}
 const total=(vencimento:boolean)=>dados.rubricas.filter(r=>ehVencimento(r)===vencimento).reduce((s,r)=>s+Math.round((Number(r.valor)||0)*100),0)/100
 const moeda=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
 return <form onSubmit={salvar} className="space-y-4">
  <p className="text-sm text-slate-600">Preencha os dados desta competência e confira as bases e rubricas antes da aprovação. As bases são informadas pelo RH; não são calculadas por este formulário.</p>
  {!podeEditar&&<p className="rounded border p-3">Folha {folha.status}: consulta dos dados. A edição está disponível apenas antes da aprovação.</p>}
  <fieldset disabled={!podeEditar||busy} className="space-y-4">
   <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {([['codigo_funcionario','Código do funcionário'],['sede','Sede / unidade'],['conta','Conta para depósito']] as const).map(([k,label])=><label key={k} className="text-sm">{label}<Input maxLength={160} value={dados[k]} onChange={e=>setDados({...dados,[k]:e.target.value})}/></label>)}
    <label className="text-sm">Admissão<Input type="date" value={dados.admissao} onChange={e=>setDados({...dados,admissao:e.target.value})}/></label>
    {([['salario_contratual','Salário base'],['base_inss','Base INSS'],['base_irrf','Base IRRF'],['base_fgts','Base FGTS'],['dependentes','Dependentes']] as const).map(([k,label])=><label key={k} className="text-sm">{label}<Input type="number" min={0} max={k==='dependentes'?99:99999999.99} step={k==='dependentes'?1:0.01} placeholder="Não informado" value={dados[k]??''} onChange={e=>setDados({...dados,[k]:e.target.value===''?null:Number(e.target.value)})}/></label>)}
   </div>
   <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-blue-900 text-white"><tr>{['Código','Descrição','Referência','Tipo / classificação','Valor (R$)',''].map((s,i)=><th key={i} className="p-2 text-left">{s}</th>)}</tr></thead><tbody>
    {dados.rubricas.map((r,i)=><tr key={i} className="border-b"><td className="p-1"><Input aria-label={'Código da rubrica '+(i+1)} required maxLength={20} className="min-w-20" value={r.codigo} onChange={e=>rubrica(i,{codigo:e.target.value})}/></td><td className="p-1"><Input aria-label={'Descrição da rubrica '+(i+1)} required maxLength={160} className="min-w-52" value={r.descricao} onChange={e=>rubrica(i,{descricao:e.target.value})}/></td><td className="p-1"><Input aria-label={'Referência da rubrica '+(i+1)} maxLength={40} placeholder="30 dias, 8h..." className="min-w-28" value={r.referencia} onChange={e=>rubrica(i,{referencia:e.target.value})}/></td><td className="p-1"><select aria-label={'Classificação da rubrica '+(i+1)} className="border rounded p-2 max-w-52" value={r.campo} onChange={e=>rubrica(i,{campo:e.target.value as Rubrica['campo']})}>{CAMPOS_RUBRICA.map(([campo,nome,tipo])=><option key={campo} value={campo}>{tipo==='vencimento'?'Vencimento':'Desconto'} · {nome}</option>)}</select></td><td className="p-1"><Input aria-label={'Valor da rubrica '+(i+1)} required type="number" min={0} max={99999999.99} step="0.01" className="min-w-28" value={r.valor} onChange={e=>rubrica(i,{valor:e.target.value===''?0:Number(e.target.value)})}/></td><td><Button type="button" variant="ghost" aria-label={'Remover rubrica '+(i+1)} onClick={()=>setDados({...dados,rubricas:dados.rubricas.filter((_,j)=>j!==i)})}>×</Button></td></tr>)}
   </tbody></table></div>
   {podeEditar&&<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={()=>adicionar('outros_proventos','Novo vencimento')}>Adicionar vencimento</Button><select aria-label="Tipo de desconto a adicionar" className="border rounded p-2" value={extra} onChange={e=>setExtra(e.target.value)}>{extras.map(s=><option key={s}>{s}</option>)}</select><Button type="button" variant="outline" onClick={()=>adicionar('outros_descontos',extra)}>Adicionar desconto</Button></div>}
   <label className="block text-sm">Observações<textarea className="block w-full border rounded p-2" maxLength={2000} rows={3} value={obs} onChange={e=>setObs(e.target.value)}/></label>
  </fieldset>
  <div className="rounded border bg-blue-50 p-4 flex flex-wrap gap-5"><span>Vencimentos: <strong>{moeda(total(true))}</strong></span><span>Descontos: <strong>{moeda(total(false))}</strong></span><span>Líquido: <strong>{moeda(total(true)-total(false))}</strong></span></div>
  {podeEditar&&<div><Button type="submit" disabled={busy}>{busy?'Salvando...':'Salvar demonstrativo'}</Button><p className="text-xs text-slate-600 mt-2">Salve antes de imprimir ou aprovar. Os totais são atualizados a partir das rubricas informadas.</p></div>}
 </form>
}
