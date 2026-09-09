'use client'

import DocumentosDependente from '@/components/DocumentosDependente'
import { DOCUMENTACAO_VAZIA, validarDocumentacao, hojeBrasil } from '@/lib/documentos-dependente'
import QRCode from 'qrcode'
import { codigoCarteirinha } from '@/lib/carteirinha-qr'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaginaProtegida, ComPermissao } from '@/components/ui/permissao'
import { usePermissaoPagina } from '@/modules/auth'
import { formatCPF, formatDate } from '@/lib/utils'

type Dependente = {
  id: string; associado_id: string; nome: string; cpf: string | null; rg: string | null
  data_nascimento: string | null; parentesco: string | null; telefone: string | null
  email: string | null; status: string | null; foto_url: string | null
}
type Titular = { id: string; nome: string; numero_titulo: string | number | null }

export default function DetalhesDependentePage() {
  const { id } = useParams<{ id: string }>()
  const [supabase] = useState(() => createClientComponentClient())
  const permissao = usePermissaoPagina('dependentes')
  const [dependente, setDependente] = useState<Dependente | null>(null)
  const [titular, setTitular] = useState<Titular | null>(null)
  const [docs, setDocs] = useState(DOCUMENTACAO_VAZIA)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setErro('')
    setDependente(null)
    setTitular(null)
    if (permissao.loading || !permissao.podeVisualizar) return
    const carregar = async () => {
      try {
        const { data, error } = await supabase.from('dependentes')
          .select('*')
          .eq('id', id).maybeSingle()
        if (error) throw error
        if (cancelado) return
        if (!data) { setErro('Dependente não encontrado ou sem permissão de acesso.'); return }
        const qr = await QRCode.toDataURL(codigoCarteirinha(data.id,data.qr_code,true),{width:200,margin:2})
        if (cancelado) return
        setQrCodeUrl(qr)
        setDependente(data)
        setDocs(Object.fromEntries(Object.keys(DOCUMENTACAO_VAZIA).map(k=>[k,data[k] ?? ''])) as typeof DOCUMENTACAO_VAZIA)
        const resultado = await supabase.from('associados').select('id,nome,numero_titulo')
          .eq('id', data.associado_id).maybeSingle()
        if (resultado.error) throw resultado.error
        if (!cancelado) setTitular(resultado.data)
      } catch {
        if (!cancelado) setErro('Não foi possível carregar os dados. Recarregue a página para tentar novamente.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    carregar()
    return () => { cancelado = true }
  }, [id, supabase, permissao.loading, permissao.podeVisualizar])

  const parentescos: Record<string, string> = {
    conjuge: 'Cônjuge', filho: 'Filho(a)', filha: 'Filha', filho_universitario: 'Filho(a) universitário',
    pai: 'Pai', mae: 'Mãe', sogra: 'Sogra', enteado: 'Enteado(a)', adotado: 'Filho(a) adotado', outro: 'Outro',
  }

  return (
    <PaginaProtegida codigoPagina="dependentes">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Link href="/dashboard/dependentes"><Button variant="outline">Voltar para dependentes</Button></Link>
        <Card>
          <CardHeader><CardTitle>Detalhes do dependente</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p>Carregando...</p> : erro ? <p role="alert">{erro}</p> : dependente && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">{dependente.nome}</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ['CPF', formatCPF(dependente.cpf)], ['RG', dependente.rg],
                    ['Nascimento', dependente.data_nascimento ? formatDate(dependente.data_nascimento) : null],
                    ['Parentesco', parentescos[dependente.parentesco ?? ''] ?? dependente.parentesco],
                    ['Telefone', dependente.telefone], ['E-mail', dependente.email], ['Status', dependente.status],
                  ].map(([label, valor]) => (
                    <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd>{valor || '—'}</dd></div>
                  ))}
                </dl>
                <div>
                  <h3 className="font-medium">Titular</h3>
                  {titular ? <Link className="text-blue-600 underline" href={`/dashboard/associados/${titular.id}`}>
                    {titular.nome} — Título {titular.numero_titulo ?? '—'}
                  </Link> : <p>Titular indisponível para consulta.</p>}
                </div>
                <p role="status">{validarDocumentacao(dependente.parentesco ?? '', dependente.data_nascimento ?? '', docs, hojeBrasil()) || 'Documentação em dia.'}</p>
                <DocumentosDependente supabase={supabase} value={docs} onChange={setDocs} readOnly />
                {qrCodeUrl && <div><h3 className="font-medium">QR Code para a portaria</h3><img src={qrCodeUrl} width={200} height={200} alt="QR Code do dependente" /></div>}
                <ComPermissao codigoPagina="dependentes" acao="editar">
                  <Link href={`/dashboard/dependentes/${id}/editar`}><Button>Editar dependente</Button></Link>
                </ComPermissao>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PaginaProtegida>
  )
}
