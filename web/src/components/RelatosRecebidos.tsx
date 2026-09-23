'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Relato = {
  id: string
  assunto: string
  descricao: string
  local: string
  data_ocorrencia: string
  status: string
  associado: { nome: string; numero_titulo: number } | null
}
const statusLabels: Record<string, string> = {
  recebido: 'Recebido', em_analise: 'Em análise', respondido: 'Respondido', encerrado: 'Encerrado',
}

export function RelatosRecebidos({ onRecebidosChange }: { onRecebidosChange?: (total: number | null) => void }) {
  const [relatos, setRelatos] = useState<Relato[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const controller = useRef<AbortController | null>(null)
  const carregar = useCallback(async () => {
    controller.current?.abort()
    const atual = new AbortController()
    controller.current = atual
    setLoading(true)
    try {
      const r = await fetch('/api/infracoes/relatos', { cache: 'no-store', signal: atual.signal })
      if (!r.ok) throw new Error('Não foi possível consultar os relatos do aplicativo.')
      const data = await r.json()
      if (!Array.isArray(data.relatos)) throw new Error('Resposta inválida ao consultar os relatos.')
      if (!atual.signal.aborted) { setRelatos(data.relatos); setErro(''); onRecebidosChange?.(typeof data.recebidos === 'number' ? data.recebidos : null) }
    } catch {
      if (!atual.signal.aborted) { setErro('Não foi possível atualizar os relatos. Tente novamente.'); onRecebidosChange?.(null) }
    } finally {
      if (!atual.signal.aborted) setLoading(false)
    }
  }, [onRecebidosChange])
  useEffect(() => {
    void carregar()
    const atualizar = () => { if (!document.hidden) void carregar() }
    const timer = window.setInterval(atualizar, 60000)
    window.addEventListener('focus', atualizar)
    document.addEventListener('visibilitychange', atualizar)
    return () => {
      controller.current?.abort()
      clearInterval(timer)
      window.removeEventListener('focus', atualizar)
      document.removeEventListener('visibilitychange', atualizar)
    }
  }, [carregar])

  return <Card aria-labelledby="relatos-recebidos-titulo">
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle id="relatos-recebidos-titulo">Relatos recebidos pelo aplicativo{!loading && !erro ? ` (${relatos.length})` : ''}</CardTitle>
        <Button type="button" variant="outline" disabled={loading} onClick={() => void carregar()}>{loading ? 'Atualizando…' : 'Atualizar relatos'}</Button>
      </div>
      <p className="text-sm text-muted-foreground">Ocorrências enviadas pelos associados para análise da equipe. O envio não aplica uma penalidade.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {erro && <p role="alert" className="text-red-700">{erro}</p>}
      {loading && !relatos.length && <p role="status">Carregando relatos…</p>}
      {!loading && !erro && !relatos.length && <p>Nenhum relato recebido pelo aplicativo.</p>}
      {relatos.length > 0 && <>
        <p className="text-sm text-muted-foreground">Relatos consultados: {relatos.length} · Recebidos: {relatos.filter(r => r.status === 'recebido').length} · Em análise: {relatos.filter(r => r.status === 'em_analise').length}.</p>
        <ul className="space-y-3">
          {relatos.slice(0, 5).map(relato => <li key={relato.id} className="min-w-0 rounded-lg border p-4 space-y-2 break-words">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{relato.assunto}</h3>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800">{statusLabels[relato.status] || relato.status}</span>
            </div>
            <p className="text-sm">Enviado por {relato.associado?.nome || 'Associado'}{relato.associado?.numero_titulo ? ` · Título ${relato.associado.numero_titulo}` : ''}</p>
            <p className="text-sm text-muted-foreground">{relato.data_ocorrencia?.split('-').reverse().join('/')} · {relato.local} · Protocolo {relato.id.slice(0, 8).toUpperCase()}</p>
            <p className="whitespace-pre-wrap">{relato.descricao}</p>
            <Link className="inline-flex min-h-11 items-center text-blue-700 underline" href={`/dashboard/infracoes/relatos#relato-${relato.id}`}>Abrir relato e analisar →</Link>
          </li>)}
        </ul>
      </>}
      <Link className="inline-flex min-h-11 items-center text-blue-700 underline" href="/dashboard/infracoes/relatos">Ver todos os relatos e respostas →</Link>
      {relatos.length >= 200 && <p className="text-sm text-muted-foreground">A consulta mostra os 200 relatos mais recentes.</p>}
    </CardContent>
  </Card>
}
