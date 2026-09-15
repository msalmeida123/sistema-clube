'use client'
import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {createClient} from '@/lib/supabase/client'
import {toast} from 'sonner'
import type {FolhaPagamento} from '../types'
import {calcularEncargos,incidenciasPadrao} from '../encargos'
import {CAMPOS_RUBRICA,detalhesHolerite,ehVencimento,Rubrica,DetalhesHolerite} from '../holerite'

const extras=['Outros descontos','Contribuição sindical','Pensão alimentícia','Plano de saúde','Coparticipação médica','Assistência odontológica','Academia','Vale-alimentação']
export function HoleriteEditor({folha,onSave}:{folha:FolhaPagamento;onSave:()=>void}){
 const [dados,setDados]=useState<DetalhesHolerite>(()=>{const d=detalhesHolerite(folha);return {...d,rubricas:d.rubricas.map(r=>({...r,incidencias:r.incidencias??incidenciasPadrao(r.campo)}))}}),[obs,setObs]=useState(folha.observacao||''),[busy,setBusy]=useState(false),[extra,setExtra]=useState(extras[0])
 const [pendente,setPendente]=useState(false)
 async function calcular(){setBusy(true);try{const r=await fetch('/api/rh/encargos');const res=await r.json();if(!r.ok)throw Error(res.error);if(!res.config)throw Error('Salve os parâmetros em RH → Configuração → Encargos.');setDados(calcularEncargos(dados,res.config.parametros,folha.referencia));setPendente(false);toast.success('Bases e encargos calculados. Confira e salve o demonstrativo.')}catch(e:any){toast.error(e.message)}finally{setBusy(false)}}
 const podeEditar=['rascunho','calculada'].includes(folha.status)
 function rubrica(index:number,patch:Partial<Rubrica>){if(patch.valor!==undefined||patch.campo!==undefined||patch.incidencias!==undefined)setPendente(true);setDados({...dados,rubricas:dados.rubricas.map((r,i)=>i===index?{...r,...patch}:r)})}
 function adicionar(campo:Rubrica['campo'],descricao:string){if(dados.rubricas.length>=98)return;setPendente(true);setDados({...dados,rubricas:[...dados.rubricas,{campo,descricao,codigo:'D'+String(dados.rubricas.length+1).padStart(3,'0'),referencia:'',valor:0,incidencias:incidenciasPadrao(campo)}]})}
 function quinzena(patch:Partial<Rubrica>){
  const index=dados.rubricas.findIndex(r=>r.campo==='adiantamento')
  if(index>=0){rubrica(index,patch);return}
  setPendente(true)
  setDados({...dados,rubricas:[...dados.rubricas,{campo:'adiantamento',codigo:'ADI',descricao:'Adiantamento quinzenal',referencia:'Quinzena',valor:0,incidencias:incidenciasPadrao('adiantamento'),...patch}]})
 }
 const adiantamentos=dados.rubricas.map((r,index)=>({r,index})).filter(({r})=>r.campo==='adiantamento')
 async function salvar(e:React.FormEvent){e.preventDefault();if(pendente&&dados.calculo_encargos){toast.error('Recalcule os encargos após alterar os valores ou incidências.');return}setBusy(true);try{const {error}=await createClient().rpc('rh_salvar_holerite',{p_id:folha.id,p_versao:folha.updated_at??null,p_detalhes:{...dados,rubricas:dados.rubricas.map(r=>r.campo==='adiantamento'?{...r,codigo:r.codigo||'ADI'}:r),fgts_valor:dados.base_fgts!=null&&dados.fgts_aliquota!=null?Math.round(dados.base_fgts*dados.fgts_aliquota)/100:null},p_observacao:obs});if(error)throw error;toast.success('Demonstrativo e totais salvos');onSave()}catch(e:any){toast.error(e.message||'Não foi possível salvar')}finally{setBusy(false)}}
 const total=(vencimento:boolean)=>dados.rubricas.filter(r=>ehVencimento(r)===vencimento).reduce((s,r)=>s+Math.round((Number(r.valor)||0)*100),0)/100
 const moeda=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
 return <form onSubmit={salvar} className="space-y-4">
  <p className="text-sm text-slate-600">Preencha os dados desta competência e confira as bases e rubricas antes da aprovação. Use Calcular bases e encargos para aplicar os parâmetros salvos ou informe as bases manualmente.</p>
  {!podeEditar&&<p className="rounded border p-3">Folha {folha.status}: consulta dos dados. A edição está disponível apenas antes da aprovação.</p>}
  <fieldset disabled={!podeEditar||busy} className="space-y-4">
   <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {([['codigo_funcionario','Código do funcionário'],['sede','Sede / unidade'],['conta','Conta para depósito']] as const).map(([k,label])=><label key={k} className="text-sm">{label}<Input maxLength={160} value={dados[k]} onChange={e=>setDados({...dados,[k]:e.target.value})}/></label>)}
    <label className="text-sm">Admissão<Input type="date" value={dados.admissao} onChange={e=>setDados({...dados,admissao:e.target.value})}/></label>
    {([['salario_contratual','Salário base'],['base_inss','Base INSS'],['base_irrf','Base IRRF'],['base_fgts','Base FGTS'],['dependentes','Dependentes']] as const).map(([k,label])=><label key={k} className="text-sm">{label}<Input type="number" min={0} max={k==='dependentes'?99:99999999.99} step={k==='dependentes'?1:0.01} placeholder="Não informado" value={dados[k]??''} onChange={e=>(setPendente(true),setDados({...dados,[k]:e.target.value===''?null:Number(e.target.value),...(['base_inss','base_irrf','base_fgts'].includes(k)?{calculo_encargos:undefined}:{})}))}/></label>)}
   </div>
   <section className="border rounded p-4 space-y-3">
    <h3 className="font-semibold">Bases e encargos</h3>
    <div className="grid sm:grid-cols-3 gap-3">
     <label>Mês do pagamento (IRRF)<Input type="month" value={dados.mes_irrf||folha.referencia} onChange={e=>{setPendente(true);setDados({...dados,mes_irrf:e.target.value})}}/></label>
     <label>FGTS (%)<Input type="number" min={0} max={100} step="0.01" placeholder="Padrão da configuração" value={dados.fgts_aliquota??''} onChange={e=>{setPendente(true);setDados({...dados,fgts_aliquota:e.target.value===''?null:Number(e.target.value)})}}/></label>
     <label>Outras deduções legais do IRRF (R$)<Input type="number" min={0} step="0.01" value={dados.outras_deducoes_irrf??0} onChange={e=>{setPendente(true);setDados({...dados,outras_deducoes_irrf:Number(e.target.value)})}}/></label>
     <label>Deduções do IRRF<select className="block border rounded p-2" value={dados.regime_irrf||'mais_favoravel'} onChange={e=>{setPendente(true);setDados({...dados,regime_irrf:e.target.value as 'legais'|'mais_favoravel'})}}><option value="mais_favoravel">Mais favorável: legais ou simplificado</option><option value="legais">Somente deduções legais</option></select></label>
    </div>
    <p className="text-sm">Informe dependentes, inclusive zero, e confira as incidências abaixo. Em descontos, uma incidência marcada reduz a respectiva base. Use outras deduções do IRRF apenas para valores legais, como pensão dedutível, sem repetir INSS ou dependentes.</p>
    <Button type="button" variant="outline" onClick={()=>void calcular()}>Calcular bases e encargos</Button>
    {dados.fgts_valor!=null&&<p>FGTS da empresa: <strong>{moeda(dados.fgts_valor)}</strong> · não desconta do líquido.</p>}
    {pendente&&dados.calculo_encargos!=null&&<p role="alert">Os valores mudaram. Recalcule antes de salvar. <Button type="button" variant="outline" onClick={()=>{setDados({...dados,calculo_encargos:undefined});setPendente(false)}}>Usar ajustes manuais do RH</Button></p>}
   </section>
   <section className="border rounded p-4 space-y-3">
    <h3 className="font-semibold">Quinzena / adiantamento salarial</h3>
    <p className="text-sm text-slate-600">Informe o valor já pago na quinzena. Ele será descontado do pagamento final e aparecerá com a descrição abaixo no holerite.</p>
    {(adiantamentos.length?adiantamentos:[{r:{campo:'adiantamento',codigo:'ADI',descricao:'Adiantamento quinzenal',referencia:'Quinzena',valor:0} as Rubrica,index:-1}]).map(({r,index})=>{
     const atualizar=(patch:Partial<Rubrica>)=>index<0?quinzena(patch):rubrica(index,patch)
     return <div key={index} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <label>Valor da quinzena (R$)<Input type="number" min="0" max="99999999.99" step="0.01" value={r.valor} onChange={e=>atualizar({valor:Number(e.target.value)})}/></label>
      <label>Descrição na folha<Input required maxLength={160} value={r.descricao} onChange={e=>atualizar({descricao:e.target.value})}/></label>
      <label>Referência da quinzena<Input maxLength={40} value={r.referencia} onChange={e=>atualizar({referencia:e.target.value})}/></label>
      <label>Código do desconto<Input required maxLength={20} value={r.codigo||'ADI'} onChange={e=>atualizar({codigo:e.target.value})}/></label>
     </div>
    })}
   </section>
   <h3 className="font-semibold">Vencimentos e outros descontos</h3>
   <p className="text-sm text-slate-600">Use Adicionar desconto para lançar cada desconto separadamente. Informe a descrição e o valor; cada lançamento será discriminado na impressão.</p>
   <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-blue-900 text-white"><tr>{['Código','Descrição','Referência','Tipo / classificação','Valor (R$)','Incide em',''].map((s,i)=><th key={i} className="p-2 text-left">{s}</th>)}</tr></thead><tbody>
    {dados.rubricas.map((r,i)=>r.campo==='adiantamento'?null:<tr key={i} className="border-b"><td className="p-1"><Input aria-label={'Código da rubrica '+(i+1)} required maxLength={20} className="min-w-20" value={r.codigo} onChange={e=>rubrica(i,{codigo:e.target.value})}/></td><td className="p-1"><Input aria-label={'Descrição da rubrica '+(i+1)} required maxLength={160} className="min-w-52" value={r.descricao} onChange={e=>rubrica(i,{descricao:e.target.value})}/></td><td className="p-1"><Input aria-label={'Referência da rubrica '+(i+1)} maxLength={40} placeholder="30 dias, 8h..." className="min-w-28" value={r.referencia} onChange={e=>rubrica(i,{referencia:e.target.value})}/></td><td className="p-1"><select aria-label={'Classificação da rubrica '+(i+1)} className="border rounded p-2 max-w-52" value={r.campo} onChange={e=>rubrica(i,{campo:e.target.value as Rubrica['campo'],incidencias:incidenciasPadrao(e.target.value)})}>{CAMPOS_RUBRICA.map(([campo,nome,tipo])=><option key={campo} value={campo}>{tipo==='vencimento'?'Vencimento':'Desconto'} · {nome}</option>)}</select></td><td className="p-1"><Input aria-label={'Valor da rubrica '+(i+1)} required type="number" min={0} max={99999999.99} step="0.01" className="min-w-28" value={r.valor} onChange={e=>rubrica(i,{valor:e.target.value===''?0:Number(e.target.value)})}/></td><td className="p-2 min-w-32">{!['inss','irrf'].includes(r.campo)&&<>{(['inss','irrf','fgts'] as const).map(k=><label key={k} className="block whitespace-nowrap"><input type="checkbox" checked={r.incidencias?.[k]??false} onChange={e=>rubrica(i,{incidencias:{inss:false,irrf:false,fgts:false,...r.incidencias,[k]:e.target.checked}})}/> {k.toUpperCase()}</label>)}{!r.incidencias&&<Button type="button" variant="ghost" onClick={()=>rubrica(i,{incidencias:{inss:false,irrf:false,fgts:false}})}>Sem incidência</Button>}</>}</td><td><Button type="button" variant="ghost"  aria-label={'Remover rubrica '+(i+1)} onClick={()=>{setPendente(true);setDados({...dados,rubricas:dados.rubricas.filter((_,j)=>j!==i)})}}>×</Button></td></tr>)}
   </tbody></table></div>
   {podeEditar&&<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={()=>adicionar('outros_proventos','Novo vencimento')}>Adicionar vencimento</Button><select aria-label="Tipo de desconto a adicionar" className="border rounded p-2" value={extra} onChange={e=>setExtra(e.target.value)}>{extras.map(s=><option key={s}>{s}</option>)}</select><Button type="button" variant="outline" onClick={()=>adicionar('outros_descontos',extra)}>Adicionar desconto</Button></div>}
   <label className="block text-sm">Observações<textarea className="block w-full border rounded p-2" maxLength={2000} rows={3} value={obs} onChange={e=>setObs(e.target.value)}/></label>
  </fieldset>
  <div className="rounded border bg-blue-50 p-4 flex flex-wrap gap-5"><span>Vencimentos: <strong>{moeda(total(true))}</strong></span><span>Descontos: <strong>{moeda(total(false))}</strong></span><span>Líquido: <strong>{moeda(total(true)-total(false))}</strong></span></div>
  {podeEditar&&<div><Button type="submit" disabled={busy}>{busy?'Salvando...':'Salvar demonstrativo'}</Button><p className="text-xs text-slate-600 mt-2">Salve antes de imprimir ou aprovar. Os totais são atualizados a partir das rubricas informadas.</p></div>}
 </form>
}
