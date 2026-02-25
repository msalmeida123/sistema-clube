import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import net from 'net'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/bar/nfce/cancelar
 * 
 * Cancela uma NFC-e autorizada via ACBrMonitor.
 * Comando: NFe.Cancelar(chaveNFe, justificativa, CNPJ, lote)
 */
export async function POST(req: NextRequest) {
  try {
    const { nfce_id, justificativa } = await req.json()

    if (!nfce_id) {
      return NextResponse.json({ erro: 'nfce_id obrigatório' }, { status: 400 })
    }
    if (!justificativa || justificativa.length < 15) {
      return NextResponse.json({ erro: 'Justificativa deve ter pelo menos 15 caracteres' }, { status: 400 })
    }

    // Busca a NFC-e
    const { data: nfce } = await supabase
      .from('bar_nfce')
      .select('*')
      .eq('id', nfce_id)
      .single()

    if (!nfce) {
      return NextResponse.json({ erro: 'NFC-e não encontrada' }, { status: 404 })
    }
    if (nfce.status !== 'autorizada') {
      return NextResponse.json({ erro: 'Só é possível cancelar NFC-e autorizada' }, { status: 400 })
    }
    if (!nfce.chave_acesso) {
      return NextResponse.json({ erro: 'Chave de acesso não encontrada' }, { status: 400 })
    }

    // Busca config
    const { data: config } = await supabase
      .from('bar_config_nfce')
      .select('*')
      .maybeSingle()

    if (!config?.ativo) {
      return NextResponse.json({ erro: 'NFC-e não configurada' }, { status: 400 })
    }

    const acbrUrl = config.acbr_url || 'localhost:3434'
    const [host, portStr] = acbrUrl.replace('http://', '').replace('https://', '').split(':')
    const port = parseInt(portStr) || 3434
    const cnpj = (config.cnpj_emitente || '').replace(/[.\-\/]/g, '')

    // Comando ACBr: NFe.Cancelar(chave, justificativa, CNPJ, lote)
    const comando = `NFe.Cancelar("${nfce.chave_acesso}", "${justificativa}", "${cnpj}", 1)`

    const resposta = await enviarComandoACBr(host, port, comando)

    if (resposta.startsWith('OK:')) {
      // Atualiza status
      await supabase
        .from('bar_nfce')
        .update({
          status: 'cancelada',
          mensagem_retorno: 'Cancelada: ' + justificativa,
          updated_at: new Date().toISOString()
        })
        .eq('id', nfce_id)

      // Atualiza pedido
      if (nfce.pedido_id) {
        await supabase
          .from('bar_pedidos')
          .update({ status: 'cancelado' })
          .eq('id', nfce.pedido_id)
      }

      return NextResponse.json({ sucesso: true, mensagem: 'NFC-e cancelada com sucesso' })
    } else {
      const erroMsg = resposta.startsWith('ERRO:') ? resposta.substring(5).trim() : resposta
      return NextResponse.json({ sucesso: false, erro: erroMsg }, { status: 422 })
    }
  } catch (err: any) {
    console.error('[NFC-e Cancelar] Erro:', err)
    return NextResponse.json({ sucesso: false, erro: err.message }, { status: 500 })
  }
}

function enviarComandoACBr(host: string, port: number, comando: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()
    let buffer = ''

    const timer = setTimeout(() => {
      client.destroy()
      reject(new Error('Timeout ao aguardar resposta do ACBrMonitor'))
    }, 30000)

    client.connect(port, host, () => {
      client.write(comando + '\r\n')
    })

    client.on('data', (data) => {
      buffer += data.toString()
      if (buffer.includes('\x03')) {
        clearTimeout(timer)
        client.end()
        resolve(buffer.replace('\x03', '').trim())
      }
    })

    client.on('error', (err) => { clearTimeout(timer); reject(err) })
    client.on('close', () => { clearTimeout(timer); if (buffer) resolve(buffer.trim()) })
  })
}
