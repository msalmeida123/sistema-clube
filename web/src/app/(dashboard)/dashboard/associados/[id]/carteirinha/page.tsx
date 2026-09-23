'use client'
import VersoCarteirinha from '@/components/VersoCarteirinha'
import {BotaoImpressao} from '@/components/BotaoImpressao'
import {reservarDocumento,abrirDocumento} from '@/lib/impressao-documento'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { codigoCarteirinha } from '@/lib/carteirinha-qr'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'
import type { Associado } from '@/types/database'

export default function CarteirinhaPage() {
  const [papel,setPapel]=useState<'cupom80'|'a4'>('cupom80')
  const { id } = useParams()
  const [associado, setAssociado] = useState<(Associado & {qr_code?: string | null}) | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [segundaVia, setSegundaVia] = useState(false)
  const [renovando, setRenovando] = useState(false)
  const renovandoRef = useRef(false)
  const [erroQr, setErroQr] = useState('')

  const [clubeConfig, setClubeConfig] = useState<any>(null)
  const cardFrenteRef = useRef<HTMLDivElement>(null)
  const cardVersoRef = useRef<HTMLDivElement>(null)
  const [supabase] = useState(() => createClientComponentClient())

  useEffect(() => {
    const fetch = async () => {
      const { data: a } = await supabase.from('associados').select('*').eq('id', id).single()
      const { data: c } = await supabase.from('clube_config').select('*').limit(1).single()
      setAssociado(a)
      setClubeConfig(c)
      if (a) {
        const hash = codigoCarteirinha(a.id, a.qr_code)
        const qr = await QRCode.toDataURL(hash, { width: 240, margin: 4 })
        setQrCodeUrl(qr)
      }
    }
    fetch()
  }, [id, supabase])

  const renovarCarteirinha = async () => {
    if (!associado || !segundaVia || renovandoRef.current) return
    renovandoRef.current = true; setRenovando(true); setErroQr(''); setQrCodeUrl('')
    try {
      const {data, error} = await supabase.rpc('renovar_qr_associado', {
        p_associado: associado.id, p_qr_anterior: associado.qr_code ?? null
      })
      if (error || typeof data !== 'string') throw Error('Falha na emissão')
      setAssociado({...associado,qr_code:data})
      setQrCodeUrl(await QRCode.toDataURL(data,{width:240,margin:4}))
      setSegundaVia(false)
      toast.success('Nova carteirinha emitida. O QR Code anterior foi invalidado.')
    } catch {
      setErroQr('Não foi possível confirmar a nova carteirinha. Atualize a página antes de imprimir ou tentar novamente.')
    } finally { renovandoRef.current=false; setRenovando(false) }
  }

  const getPlanoColor = (plano: string) => {
    const colors: Record<string, string> = { individual: '#3B82F6', familiar: '#22C55E', patrimonial: '#F59E0B' }
    return colors[plano] || '#6B7280'
  }

  const gerarPDF = async (imprimir = false) => {
    if (!cardFrenteRef.current || !qrCodeUrl) return
    const janela = imprimir ? reservarDocumento() : null
    if (imprimir && !janela) {
      return
    }
    try {
      const imagens = [cardFrenteRef.current, cardVersoRef.current].flatMap(el => el ? Array.from(el.querySelectorAll('img')) : [])
      await Promise.all(imagens.map(img => img.decode().catch(() => undefined)))
      await document.fonts.ready
      const canvas = await html2canvas(cardFrenteRef.current, { scale: 3 })
      const imgData = canvas.toDataURL('image/png')
      let conteudo=`<img src="${imgData}" alt="Frente da carteirinha" style="width:85.6mm;height:54mm;display:block;margin-bottom:10mm">`
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54)

      // Adicionar verso se disponível
      if (cardVersoRef.current) {
        const canvasVerso = await html2canvas(cardVersoRef.current, { scale: 3 })
        const imgVerso = canvasVerso.toDataURL('image/png')
        pdf.addPage([85.6, 54], 'landscape')
        pdf.addImage(imgVerso, 'PNG', 0, 0, 85.6, 54)
        conteudo+=`<img src="${imgVerso}" alt="Verso da carteirinha" style="width:85.6mm;height:54mm;display:block">`
      }

      if (janela) {
        abrirDocumento('Carteirinha do associado',conteudo,janela,papel==='cupom80'?'cupom80':undefined)
      } else {
        pdf.save("carteirinha-" + associado?.numero_titulo + '.pdf')
      }
    } catch {
      janela?.close()
      toast.error('Não foi possível gerar a carteirinha. Tente novamente.')
    }
  }

  if (!associado) return <div className="p-6">Carregando...</div>

  return (
    <div className="space-y-6">
      {/* Header - escondido na impressão */}
      <div className="flex items-center gap-4 no-print">
        <Link href={`/dashboard/associados/${id}`}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-2xl font-bold">Carteirinha do Associado</h2>
      </div>

      <Card className="no-print">
        <CardHeader><CardTitle>Segunda via por perda</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label htmlFor="segunda-via" className="flex items-start gap-3 cursor-pointer">
            <input id="segunda-via" type="checkbox" checked={segundaVia} disabled={renovando}
              onChange={e=>setSegundaVia(e.target.checked)} className="mt-1 h-5 w-5" aria-describedby="segunda-via-aviso" />
            <span>A carteirinha foi perdida. Gerar um novo QR Code e invalidar o anterior.</span>
          </label>
          <p id="segunda-via-aviso" className="text-sm text-muted-foreground">
            Ao confirmar, a carteirinha anterior deixará de funcionar, mesmo que seja encontrada.
            O aplicativo do associado mostrará o novo código ao atualizar a carteirinha.
          </p>
          <Button onClick={renovarCarteirinha} disabled={!segundaVia || renovando || !!erroQr} aria-busy={renovando}>
            {renovando ? 'Emitindo nova carteirinha...' : 'Gerar novo QR Code'}
          </Button>
          {erroQr && <p role="alert" className="text-red-700">{erroQr}</p>}
        </CardContent>
      </Card>

      {/* Área de impressão */}
      <div className="flex flex-wrap gap-6 print-area">
        {/* Preview da Carteirinha - Frente */}
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="no-print"><CardTitle>Frente</CardTitle></CardHeader>
          <CardContent className="p-2 sm:p-6 print:p-0">
            <div ref={cardFrenteRef} className="relative bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none" style={{ width: '342px', height: '216px' }}>
              {/* Barra de cor do plano */}
              <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: getPlanoColor(associado.plano) }} />
              
              {/* Logo */}
              <div className="absolute top-4 left-4">
                {clubeConfig?.logo_url ? (
                  <img src={clubeConfig.logo_url} alt="Logo" className="h-12 object-contain" />
                ) : (
                  <div className="text-lg font-bold text-gray-800">{clubeConfig?.nome || 'CLUBE'}</div>
                )}
              </div>

              {/* QR Code */}
              <div className="absolute top-7 right-4 bg-white">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />}
              </div>

              {/* Foto */}
              <div className="absolute bottom-4 left-4">
                {associado.foto_url ? (
                  <img src={associado.foto_url} alt="Foto" className="w-20 h-24 object-contain object-center bg-gray-100 rounded border-2 border-gray-300" />
                ) : (
                  <div className="w-20 h-24 bg-gray-200 rounded flex items-center justify-center text-3xl font-bold text-gray-400">
                    {associado.nome[0]}
                  </div>
                )}
              </div>

              {/* Dados */}
              <div className="absolute bottom-4 left-28 right-4">
                <p className="font-bold text-lg truncate">{associado.nome}</p>
                <p className="text-sm text-gray-600">Título: <span className="font-mono font-bold">{associado.numero_titulo}</span></p>
                <p className="text-sm text-gray-600 capitalize">Categoria: <span className="font-semibold">{associado.plano}</span></p>
                <p className="text-xs text-gray-500 mt-1">Válido até: 12/2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview - Verso */}
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="no-print"><CardTitle>Verso</CardTitle></CardHeader>
          <CardContent className="p-2 sm:p-6 print:p-0">
            <div ref={cardVersoRef} className="relative bg-gray-100 rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none" style={{ width: '342px', height: '216px' }}>
              <VersoCarteirinha nome={clubeConfig?.nome || 'CLUBE'}/>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="no-print space-y-2"><label className="block font-medium" htmlFor="papel-carteirinha">Papel para impressão</label><select id="papel-carteirinha" className="rounded border p-2" value={papel} onChange={e=>setPapel(e.target.value as 'cupom80'|'a4')}><option value="cupom80">Cupom não fiscal — 80 mm</option><option value="a4">Folha A4 — cartão 85,6 × 54 mm</option></select><p className="text-sm text-muted-foreground">Na impressora de cupom, selecione bobina de 80 mm, escala 100% e desative cabeçalhos e rodapés. O PDF mantém o tamanho de cartão.</p></div>
      {/* Botões - escondidos na impressão */}
      <div className="flex flex-wrap gap-4 no-print">
        <Button disabled={!qrCodeUrl || renovando || segundaVia || !!erroQr} onClick={() => gerarPDF()}><Download className="h-4 w-4 mr-2" />Baixar PDF</Button>
        <BotaoImpressao disabled={!qrCodeUrl || renovando || segundaVia || !!erroQr} variant="outline" onClick={() => gerarPDF(true)}><Printer className="h-4 w-4 mr-2" />Imprimir</BotaoImpressao>
      </div>

      {/* Instruções - escondidas na impressão */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Instruções para impressão em PVC:</strong><br />
            1. Baixe o PDF da carteirinha<br />
            2. Imprima em impressora de cartões PVC ou envie para gráfica<br />
            3. Formato: 85,6mm x 54mm (padrão ISO/IEC 7810 ID-1)<br />
            4. Imprima frente e verso
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
