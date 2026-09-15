'use client'
import {useEffect,useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {toast} from 'sonner'
import {ENCARGOS_2026,ParametrosEncargos,schemaEncargos} from '../encargos'
export function ConfiguracaoEncargos(){
 const [p,setP]=useState<ParametrosEncargos>(ENCARGOS_2026),[versao,setVersao]=useState<string|null>(null),[admin,setAdmin]=useState(false),[busy,setBusy]=useState(true),[erro,setErro]=useState('')
 async function carregar(){setBusy(true);setErro('');try{const r=await fetch('/api/rh/encargos');const d=await r.json();if(!r.ok)throw Error(d.error);setP(d.config?.parametros||ENCARGOS_2026);setVersao(d.config?.updated_at||null);setAdmin(d.isAdmin)}catch(e:any){setErro(e.message)}finally{setBusy(false)}}
 useEffect(()=>{void carregar()},[])
 async function salvar(e:React.FormEvent){e.preventDefault();const validacao=schemaEncargos.safeParse(p);if(!validacao.success){toast.error(validacao.error.issues[0].message);return}setBusy(true);try{const r=await fetch('/api/rh/encargos',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({parametros:p,versao})});const d=await r.json();if(!r.ok)throw Error(d.error);toast.success('Encargos salvos. Folhas existentes precisam ser recalculadas nos detalhes.');await carregar()}catch(e:any){toast.error(e.message)}finally{setBusy(false)}}
 return <form onSubmit={salvar} className="space-y-4 rounded-lg border p-5 max-w-4xl">
  <h2 className="text-xl font-semibold">Encargos da folha · INSS, IRRF e FGTS</h2>
  {erro&&<p role="alert" className="text-red-700">{erro} <Button type="button" variant="outline" onClick={()=>void carregar()}>Recarregar</Button></p>}
  {!versao&&!busy&&!erro&&<p>Modelo de 2026 disponível para conferência. Salve para habilitar o cálculo.</p>}
  <p className="text-sm text-slate-600">Parâmetros para folha mensal de empregado. A competência determina o INSS; o mês do pagamento determina o IRRF. Confira outros vínculos, férias, 13º e rescisões separadamente. Alterar a configuração não modifica folhas já salvas.</p>
  <fieldset disabled={busy||!admin||!!erro} className="space-y-4">
   <div className="grid sm:grid-cols-3 gap-3">
    {(['inicio','fim'] as const).map(k=><label key={k}>Vigência {k==='inicio'?'inicial':'final'}<Input required type="month" value={p[k]} onChange={e=>setP({...p,[k]:e.target.value})}/></label>)}
    {([['fgts','FGTS padrão (%)'],['dependente','Dedução por dependente (R$)'],['simplificado','Desconto simplificado mensal (R$)']] as const).map(([k,l])=><label key={k}>{l}<Input required type="number" min={0} max={k==='fgts'?100:99999999.99} step="0.01" value={p[k]} onChange={e=>setP({...p,[k]:Number(e.target.value)})}/></label>)}
   </div>
   <p className="text-sm">FGTS é encargo da empresa; não é desconto do funcionário. O percentual pode ser ajustado no holerite conforme o contrato.</p>
   <h3 className="font-semibold">INSS progressivo — cálculo por faixa</h3>
   {p.inss.map((f,i)=><div key={i} className="grid grid-cols-2 gap-3"><label>Faixa {i+1} · até (R$)<Input required type="number" min={0.01} step="0.01" value={f.ate} onChange={e=>setP({...p,inss:p.inss.map((x,j)=>j===i?{...x,ate:Number(e.target.value)}:x)})}/></label><label>Alíquota (%)<Input required type="number" min={0} max={100} step="0.01" value={f.aliquota} onChange={e=>setP({...p,inss:p.inss.map((x,j)=>j===i?{...x,aliquota:Number(e.target.value)}:x)})}/></label></div>)}
   <h3 className="font-semibold">IRRF mensal</h3>
   {p.irrf.map((f,i)=><div key={i} className="grid sm:grid-cols-3 gap-3"><label>Faixa {i+1} · até (R$){f.ate===null?<p className="p-2">Sem limite superior</p>:<Input required type="number" min={0.01} step="0.01" value={f.ate} onChange={e=>setP({...p,irrf:p.irrf.map((x,j)=>j===i?{...x,ate:Number(e.target.value)}:x)})}/>}</label>{(['aliquota','deducao'] as const).map(k=><label key={k}>{k==='aliquota'?'Alíquota (%)':'Parcela a deduzir (R$)'}<Input required type="number" min={0} max={k==='aliquota'?100:99999999.99} step="0.01" value={f[k]} onChange={e=>setP({...p,irrf:p.irrf.map((x,j)=>j===i?{...x,[k]:Number(e.target.value)}:x)})}/></label>)}</div>)}
   <label className="flex gap-2"><input type="checkbox" checked={p.reducao.ativa} onChange={e=>setP({...p,reducao:{...p.reducao,ativa:e.target.checked}})}/>Aplicar redução mensal do IRRF</label>
   {p.reducao.ativa&&<div className="grid sm:grid-cols-2 gap-3">{([['isencao','Rendimento até o qual o imposto é zerado (R$)'],['limite','Limite de rendimento da redução (R$)'],['fixa','Parcela fixa da redução (R$)'],['fator','Fator multiplicador do rendimento']] as const).map(([k,l])=><label key={k}>{l}<Input required type="number" min={0} step={k==='fator'?'0.000001':'0.01'} value={p.reducao[k]} onChange={e=>setP({...p,reducao:{...p.reducao,[k]:Number(e.target.value)}})}/></label>)}</div>}
   <Button type="submit">{busy?'Salvando...':'Salvar encargos'}</Button>
  </fieldset>
  <p className="text-xs text-slate-600">Referências do modelo: <a className="underline" href="https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal" target="_blank" rel="noreferrer">INSS</a> · <a className="underline" href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026" target="_blank" rel="noreferrer">Receita Federal 2026</a> · <a className="underline" href="https://www.caixa.gov.br/beneficios-trabalhador/fgts/Paginas/default.aspx" target="_blank" rel="noreferrer">FGTS / Caixa</a>.</p>
 </form>
}
