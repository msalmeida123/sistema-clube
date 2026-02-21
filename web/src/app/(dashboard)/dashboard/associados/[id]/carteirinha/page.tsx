'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import type { Associado } from '@/types/database'

export default function CarteirinhaPage() {
  const { id } = useParams()
  const [associado, setAssociado] = useState<Associado | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [clubeConfig, setClubeConfig] = useState<any>(null)
  const cardFrenteRef = useRef<HTMLDivElement>(null)
  const cardVersoRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: a } = await supabase.from('associados').select('*').eq('id', id).single()
      const { data: c } = await supabase.from('clube_config').select('*').limit(1).single()
      setAssociado(a)
      setClubeConfig(c)
      if (a) {
        const hash = btoa(`${a.id}-${a.cpf}-${Date.now()}`)
        const qr = await QRCode.toDataURL(hash, { width: 150, margin: 1 })
        setQrCodeUrl(qr)
      }
    }
    fetch()
  }, [id, supabase])

  const getPlanoColor = (plano: string) => {
    const colors: Record<string, string> = { individual: '#3B82F6', familiar: '#22C55E', patrimonial: '#F59E0B' }
    return colors[plano] || '#6B7280'
  }

  const gerarPDF = async () => {
    if (!cardFrenteRef.current) return
    const canvas = await html2canvas(cardFrenteRef.current, { scale: 3 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
    pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54)

    // Adicionar verso se disponível
    if (cardVersoRef.current) {
      const canvasVerso = await html2canvas(cardVersoRef.current, { scale: 3 })
      const imgVerso = canvasVerso.toDataURL('image/png')
      pdf.addPage([85.6, 54], 'landscape')
      pdf.addImage(imgVerso, 'PNG', 0, 0, 85.6, 54)
    }

    pdf.save(`carteirinha-${associado?.numero_titulo}.pdf`)
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

      {/* Área de impressão */}
      <div className="flex gap-6 print-area">
        {/* Preview da Carteirinha - Frente */}
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="no-print"><CardTitle>Frente</CardTitle></CardHeader>
          <CardContent className="print:p-0">
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
              <div className="absolute top-4 right-4">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />}
              </div>

              {/* Foto */}
              <div className="absolute bottom-4 left-4">
                {associado.foto_url ? (
                  <img src={associado.foto_url} alt="Foto" className="w-20 h-24 object-cover rounded border-2 border-gray-300" />
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
          <CardContent className="print:p-0">
            <div ref={cardVersoRef} className="relative bg-gray-100 rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none" style={{ width: '342px', height: '216px' }}>
              {clubeConfig?.foto_clube_url ? (
                <img src={clubeConfig.foto_clube_url} alt="Clube" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold">
                  {clubeConfig?.nome || 'CLUBE'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões - escondidos na impressão */}
      <div className="flex gap-4 no-print">
        <Button onClick={gerarPDF}><Download className="h-4 w-4 mr-2" />Baixar PDF</Button>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Imprimir</Button>
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
