'use client'
import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DOCUMENTOS_DEPENDENTE, type DocumentacaoDependente, type CampoDocumento } from '@/lib/documentos-dependente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function DocumentosDependente({ supabase, value, onChange, disabled = false, readOnly = false, onBusy }: {
  supabase: SupabaseClient; value: DocumentacaoDependente; onChange: (value: DocumentacaoDependente) => void; disabled?: boolean; readOnly?: boolean; onBusy?: (busy: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  const enviar = async (campo: CampoDocumento, file?: File) => {
    if (!file) return
    const extensoes: Record<string,string> = {'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png'}
    const ext = extensoes[file.type]
    if (!ext || file.size > 10*1024*1024 || !file.size) { toast.error('Envie PDF, JPG ou PNG de até 10 MB.'); return }
    setBusy(true); onBusy?.(true)
    try {
      const {data:{user}} = await supabase.auth.getUser()
      if (!user) throw new Error('Entre novamente no sistema.')
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const {error} = await supabase.storage.from('documentos-dependentes').upload(path,file,{contentType:file.type,upsert:false})
      if (error) throw error
      onChange({...value,[campo]:path})
      toast.success('Arquivo enviado. Salve o cadastro para vincular o documento.')
    } catch { toast.error('Não foi possível enviar o documento. Verifique sua permissão e a conexão.') }
    finally { setBusy(false); onBusy?.(false) }
  }
  const abrir = async (path: string) => {
    const aba = window.open('about:blank', '_blank')
    if (aba) aba.opener = null
    try {
      const {data,error} = await supabase.storage.from('documentos-dependentes').createSignedUrl(path,60)
      if (error || !data || !aba) throw new Error('Falha ao abrir')
      aba.location.href = data.signedUrl
    } catch { aba?.close(); toast.error('Não foi possível abrir o documento. Verifique o bloqueio de novas abas.') }
  }
  return <fieldset className="space-y-4 border rounded-lg p-4" disabled={disabled || busy}>
    <legend className="font-semibold">Documentos do dependente</legend>
    <p className="text-sm">Até 21 anos: certidão de nascimento para filhos. Após os 21, matrícula válida na faculdade, sem limite máximo de idade. Para cônjuge: certidão de casamento.</p>
    {DOCUMENTOS_DEPENDENTE.map(([campo,label])=><div key={campo}>
      <Label htmlFor={campo}>{label}</Label>
      {!readOnly && <Input id={campo} type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>enviar(campo,e.target.files?.[0])}/>}
      {value[campo] && <Button type="button" variant="outline" onClick={()=>abrir(value[campo])}>Ver documento anexado</Button>}
    </div>)}
    <Label htmlFor="instituicao_ensino">Faculdade</Label>
    <Input id="instituicao_ensino" readOnly={readOnly} value={value.instituicao_ensino} onChange={e=>onChange({...value,instituicao_ensino:e.target.value})}/>
    <Label htmlFor="matricula_valida_ate">Comprovante de matrícula válido até</Label>
    <Input id="matricula_valida_ate" readOnly={readOnly} type="date" value={value.matricula_valida_ate} onChange={e=>onChange({...value,matricula_valida_ate:e.target.value})}/>
    <p className="text-sm text-muted-foreground">PDF, JPG ou PNG, até 10 MB. Documentos privados. Renove o comprovante quando vencer.</p>
    {busy && <p>Enviando documento...</p>}
  </fieldset>
}
