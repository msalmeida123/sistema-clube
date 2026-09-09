'use client'

import DocumentosDependente from '@/components/DocumentosDependente'
import { DOCUMENTACAO_VAZIA, validarDocumentacao, hojeBrasil, idadeDependente } from '@/lib/documentos-dependente'
import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaginaProtegida } from '@/components/ui/permissao'
import { usePermissaoPagina } from '@/modules/auth'
import { toast } from 'sonner'

type Formulario = {
  nome: string
  cpf: string
  rg: string
  data_nascimento: string
  telefone: string
  email: string
}

export default function EditarDependentePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [supabase] = useState(() => createClientComponentClient())
  const permissao = usePermissaoPagina('dependentes')
  const [form, setForm] = useState<Formulario | null>(null)
  const [docs, setDocs] = useState(DOCUMENTACAO_VAZIA)
  const [parentesco, setParentesco] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let cancelado = false
    setForm(null)
    setErro('')
    if (permissao.loading || !permissao.podeVisualizar) return
    const carregar = async () => {
      try {
        const { data, error } = await supabase.from('dependentes')
          .select('*').eq('id', id).maybeSingle()
        if (cancelado) return
        if (error) { setErro('Não foi possível carregar o dependente.'); return }
        if (!data) { setErro('Dependente não encontrado ou sem permissão de acesso.'); return }
        setParentesco(data.parentesco ?? '')
        setDocs(Object.fromEntries(Object.keys(DOCUMENTACAO_VAZIA).map(k=>[k,data[k] ?? ''])) as typeof DOCUMENTACAO_VAZIA)
        setForm({ nome: data.nome ?? '', cpf: data.cpf ?? '', rg: data.rg ?? '',
          data_nascimento: data.data_nascimento ?? '', telefone: data.telefone ?? '', email: data.email ?? '' })
      } catch {
        if (!cancelado) setErro('Falha de conexão ao carregar o dependente.')
      }
    }
    carregar()
    return () => { cancelado = true }
  }, [id, supabase, permissao.loading, permissao.podeVisualizar])

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form || salvando || enviando || !permissao.podeEditar) return
    if (!form.nome.trim()) { toast.error('Informe o nome.'); return }
    const erroDocumento = validarDocumentacao(parentesco, form.data_nascimento, docs, hojeBrasil())
    if (erroDocumento) { toast.error(erroDocumento); return }
    setSalvando(true)
    try {
      const { data, error } = await supabase.from('dependentes').update({
        nome: form.nome.trim(), cpf: form.cpf.replace(/\D/g, '') || null,
        rg: form.rg.trim() || null, data_nascimento: form.data_nascimento || null,
        telefone: form.telefone.trim() || null, email: form.email.trim() || null,
        ...Object.fromEntries(Object.entries(docs).map(([k,v])=>[k,v || null])),
        updated_at: new Date().toISOString(),
      }).eq('id', id).select('id').maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Dependente não encontrado ou sem permissão para editar.')
      toast.success('Dependente atualizado!')
      router.push('/dashboard/dependentes')
    } catch {
      toast.error('Não foi possível salvar. Verifique sua conexão e permissão e tente novamente.')
    } finally { setSalvando(false) }
  }

  return (
    <PaginaProtegida codigoPagina="dependentes">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Link href="/dashboard/dependentes"><Button variant="outline">Voltar para dependentes</Button></Link>
        <Card>
          <CardHeader><CardTitle>Editar dependente</CardTitle></CardHeader>
          <CardContent>
            {erro ? <p role="alert">{erro}</p> : !form ? <p>Carregando...</p> : (
              <form onSubmit={salvar} className="space-y-4">
                <p className="text-sm text-muted-foreground">Atualize os dados pessoais e de contato.</p>
                {([
                  ['nome', 'Nome', 'text'], ['cpf', 'CPF', 'text'], ['rg', 'RG', 'text'],
                  ['data_nascimento', 'Data de nascimento', 'date'], ['telefone', 'Telefone', 'tel'], ['email', 'E-mail', 'email'],
                ] as const).map(([campo, label, tipo]) => (
                  <div key={campo}>
                    <Label htmlFor={campo}>{label}</Label>
                    <Input id={campo} type={tipo} required={campo === 'nome'} value={form[campo]}
                      disabled={salvando || enviando || !permissao.podeEditar}
                      onChange={event => setForm({ ...form, [campo]: event.target.value })} />
                  </div>
                ))}
                <DocumentosDependente supabase={supabase} value={docs} onChange={setDocs} disabled={salvando || !permissao.podeEditar} onBusy={setEnviando} />
                {!permissao.podeEditar && <p role="alert">Você não tem permissão para editar dependentes.</p>}
                <Button type="submit" disabled={salvando || !permissao.podeEditar}>
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PaginaProtegida>
  )
}
