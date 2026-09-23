'use client'
import VersoCarteirinha from '@/components/VersoCarteirinha'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaginaProtegida } from '@/components/ui/permissao'
import { createClientComponentClient } from '@/lib/supabase/client'
import { codigoCarteirinha } from '@/lib/carteirinha-qr'
import { BotaoImpressao } from '@/components/BotaoImpressao'
import { reservarDocumento, abrirDocumento } from '@/lib/impressao-documento'

type Dependente = { id:string; nome:string; foto_url?:string|null; qr_code?:string|null; parentesco?:string|null; status?:string|null }
type Titular = { nome:string; numero_titulo:string|number|null; plano?:string|null }

const parentescos:Record<string,string> = { conjuge:'Cônjuge', filho:'Filho(a)', filha:'Filho(a)', filho_universitario:'Filho(a) universitário', pai:'Pai', mae:'Mãe', sogra:'Sogra', enteado:'Enteado(a)', adotado:'Filho(a) adotado' }

export default function CarteirinhaDependentePage() {
  const [papel,setPapel]=useState<'cupom80'|'a4'>('cupom80')
  const { id } = useParams<{id:string}>()
  const [supabase] = useState(() => createClientComponentClient())
  const [dependente, setDependente] = useState<Dependente|null>(null)
  const [titular, setTitular] = useState<Titular|null>(null)
  const [qr, setQr] = useState('')
  const [erro, setErro] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)
  const versoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ativo = true
    const carregar = async () => {
      setErro('')
      const {data,error} = await supabase.from('dependentes').select('id,nome,foto_url,qr_code,parentesco,status,associado:associados(nome,numero_titulo,plano)').eq('id',id).maybeSingle()
      if (error || !data) { if (ativo) setErro('Dependente não encontrado ou sem permissão de acesso.'); return }
      const d:any = data
      const t = Array.isArray(d.associado) ? d.associado[0] : d.associado
      const imagem = await QRCode.toDataURL(codigoCarteirinha(d.id,d.qr_code,true), {width:280,margin:4,errorCorrectionLevel:'M'})
      if (!ativo) return
      setDependente(d); setTitular(t || null); setQr(imagem)
    }
    void carregar()
    return () => { ativo=false }
  }, [id,supabase])

  const gerar = async (imprimir=false) => {
    if (!cardRef.current || !dependente || !qr) return
    const janela = imprimir ? reservarDocumento() : null
    if (imprimir && !janela) return
    try {
      await document.fonts.ready
      const imagens = [cardRef.current,versoRef.current].flatMap(el=>el?Array.from(el.querySelectorAll('img')):[])
      await Promise.all(imagens.map(img => img.decode().catch(() => undefined)))
      const canvas = await html2canvas(cardRef.current,{scale:3,backgroundColor:'#ffffff'})
      const png=canvas.toDataURL('image/png')
      const verso=versoRef.current?(await html2canvas(versoRef.current,{scale:3,backgroundColor:'#ffffff'})).toDataURL('image/png'):null
      const htmlVerso=verso?`<img src="${verso}" alt="Verso da carteirinha" style="width:85.6mm;height:54mm;display:block;margin-top:10mm">`:''
      if (janela) abrirDocumento(`Carteirinha de ${dependente.nome}`,`<img src="${png}" alt="Carteirinha de ${dependente.nome}" style="width:85.6mm;height:54mm;display:block">${htmlVerso}`,janela,papel==='cupom80'?'cupom80':undefined)
      else { const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:[85.6,54]}); pdf.addImage(png,'PNG',0,0,85.6,54); if(verso){pdf.addPage([85.6,54],'landscape');pdf.addImage(verso,'PNG',0,0,85.6,54)}; pdf.save(`carteirinha-dependente-${dependente.id}.pdf`) }
    } catch { janela?.close(); toast.error('Não foi possível gerar a carteirinha. Tente novamente.') }
  }

  return <PaginaProtegida codigoPagina="dependentes"><div className="space-y-6 p-6">
    <div className="flex items-center gap-4 no-print"><Link href={`/dashboard/dependentes/${id}`}><Button variant="outline" size="icon" aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Button></Link><h1 className="text-2xl font-bold">Carteirinha do dependente</h1></div>
    {erro ? <p role="alert" className="text-red-700">{erro}</p> : !dependente ? <p>Carregando...</p> : <>
      <Card className="w-fit"><CardHeader className="no-print"><CardTitle>Prévia</CardTitle></CardHeader><CardContent className="p-2 sm:p-6">
        <div ref={cardRef} className="relative overflow-hidden rounded-lg bg-white shadow-lg" style={{width:'342px',height:'216px'}}>
          <div className="absolute inset-x-0 top-0 h-2 bg-blue-600" />
          <div className="absolute left-4 top-5"><p className="text-lg font-bold">CLUBE</p><p className="text-xs text-gray-500">CARTEIRINHA DE DEPENDENTE</p></div>
          <div className="absolute right-4 top-5 bg-white">{qr && <img src={qr} alt="QR Code do dependente" className="h-20 w-20" />}</div>
          <div className="absolute bottom-4 left-4">{dependente.foto_url ? <img src={dependente.foto_url} alt={`Foto de ${dependente.nome}`} className="h-24 w-20 rounded border-2 border-gray-300 object-contain object-center bg-gray-100"/> : <div className="flex h-24 w-20 items-center justify-center rounded bg-gray-200 text-3xl text-gray-500">{dependente.nome[0]}</div>}</div>
          <div className="absolute bottom-4 left-28 right-4"><p className="truncate text-lg font-bold">{dependente.nome}</p><p className="text-sm text-gray-600">Dependente de: {titular?.nome || '—'}</p><p className="text-sm text-gray-600">Título: <span className="font-mono font-bold">{titular?.numero_titulo ?? '—'}</span></p><p className="text-xs text-gray-500">{parentescos[dependente.parentesco || ''] || dependente.parentesco || 'Dependente'} · {titular?.plano || 'Plano não informado'}</p></div>
        </div>
      </CardContent></Card>
      <Card className="w-fit"><CardHeader><CardTitle>Verso</CardTitle></CardHeader><CardContent><div ref={versoRef} className="overflow-hidden rounded-lg" style={{width:342,height:216}}><VersoCarteirinha/></div></CardContent></Card>
      <div className="no-print space-y-2"><label className="block font-medium" htmlFor="papel-carteirinha">Papel para impressão</label><select id="papel-carteirinha" className="rounded border p-2" value={papel} onChange={e=>setPapel(e.target.value as 'cupom80'|'a4')}><option value="cupom80">Cupom não fiscal — 80 mm</option><option value="a4">Folha A4 — cartão 85,6 × 54 mm</option></select><p className="text-sm text-muted-foreground">Na impressora de cupom, selecione bobina de 80 mm, escala 100% e desative cabeçalhos e rodapés. O PDF mantém o tamanho de cartão.</p></div>
      <div className="flex flex-wrap gap-3 no-print"><Button disabled={!qr} onClick={() => void gerar()}><Download className="mr-2 h-4 w-4"/>Baixar PDF</Button><BotaoImpressao disabled={!qr} variant="outline" onClick={() => void gerar(true)}><Printer className="mr-2 h-4 w-4"/>Imprimir</BotaoImpressao></div>
      <p className="text-sm text-muted-foreground">Este QR Code é exclusivo do dependente e pode ser usado na portaria conforme as permissões do plano do titular.</p>
    </>}
  </div></PaginaProtegida>
}
