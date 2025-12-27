'use client'

import { useRef } from 'react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface CarteirinhaProps {
  associado: {
    numero_titulo: number
    nome: string
    cpf: string
    foto_url?: string
    tipo_plano: 'individual' | 'familiar' | 'patrimonial'
    data_validade: string
  }
  clubeConfig: {
    nome: string
    logo_url?: string
    foto_clube_url?: string
  }
}

const planoColors = {
  individual: { bg: '#3B82F6', label: 'Individual' },
  familiar: { bg: '#22C55E', label: 'Familiar' },
  patrimonial: { bg: '#EAB308', label: 'Patrimonial' },
}

export default function Carteirinha({ associado, clubeConfig }: CarteirinhaProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const generateQRCode = async (data: string) => {
    return await QRCode.toDataURL(data, { width: 100, margin: 1 })
  }

  const downloadPDF = async () => {
    if (!cardRef.current) return

    const canvas = await html2canvas(cardRef.current, { scale: 3 })
    const imgData = canvas.toDataURL('image/png')
    
    // Tamanho cartão PVC: 85.6mm x 54mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 54]
    })
    
    pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54)
    pdf.save(`carteirinha-${associado.numero_titulo}.pdf`)
  }

  const planoStyle = planoColors[associado.tipo_plano]

  return (
    <div className="space-y-4">
      {/* Preview da Carteirinha */}
      <div ref={cardRef} className="inline-block">
        {/* FRENTE */}
        <div 
          className="w-[340px] h-[214px] rounded-xl overflow-hidden shadow-lg relative"
          style={{ backgroundColor: planoStyle.bg }}
        >
          {/* Header */}
          <div className="bg-white/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {clubeConfig.logo_url && (
                <img src={clubeConfig.logo_url} alt="Logo" className="h-8 w-8 object-contain" />
              )}
              <span className="text-white font-bold text-sm">{clubeConfig.nome}</span>
            </div>
            <span className="bg-white/30 text-white text-xs px-2 py-1 rounded">
              {planoStyle.label}
            </span>
          </div>

          {/* Conteúdo */}
          <div className="p-4 flex gap-4">
            {/* Foto */}
            <div className="w-24 h-28 bg-white rounded-lg overflow-hidden flex-shrink-0">
              {associado.foto_url ? (
                <img src={associado.foto_url} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                  Foto
                </div>
              )}
            </div>

            {/* Dados */}
            <div className="flex-1 text-white">
              <p className="font-bold text-lg leading-tight">{associado.nome}</p>
              <p className="text-white/80 text-sm mt-2">
                Título: <span className="font-bold">#{associado.numero_titulo}</span>
              </p>
              <p className="text-white/80 text-sm">
                CPF: {associado.cpf}
              </p>
              <p className="text-white/80 text-sm">
                Validade: {associado.data_validade}
              </p>
            </div>

            {/* QR Code */}
            <div className="w-20 h-20 bg-white rounded-lg p-1 flex-shrink-0">
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                QR
              </div>
            </div>
          </div>
        </div>

        {/* VERSO */}
        <div className="w-[340px] h-[214px] rounded-xl overflow-hidden shadow-lg mt-4">
          {clubeConfig.foto_clube_url ? (
            <img 
              src={clubeConfig.foto_clube_url} 
              alt="Clube" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{clubeConfig.nome}</span>
            </div>
          )}
        </div>
      </div>

      {/* Botão Download */}
      <button
        onClick={downloadPDF}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Baixar PDF para Impressão
      </button>
    </div>
  )
}
