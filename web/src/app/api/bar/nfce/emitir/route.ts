import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import net from 'net'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/bar/nfce/emitir
 * 
 * Envia comando NFe.CriarEnviarNFe ao ACBrMonitor via TCP Socket.
 * O ACBrMonitor deve estar configurado para comunicação TCP/IP (porta 3434 por padrão).
 * 
 * Fluxo:
 *  1. Recebe pedido_id e cpf_cnpj (opcional)
 *  2. Busca dados do pedido, config NFC-e e monta o arquivo INI da NFC-e
 *  3. Conecta via TCP Socket ao ACBrMonitor
 *  4. Envia comando NFe.CriarEnviarNFe com o conteúdo INI
 *  5. Parseia resposta e atualiza registro bar_nfce
 */
export async function POST(req: NextRequest) {
  try {
    const { pedido_id, cpf_cnpj, nfce_id } = await req.json()

    if (!pedido_id) {
      return NextResponse.json({ erro: 'pedido_id obrigatório' }, { status: 400 })
    }

    // ── Busca configuração NFC-e ──────────────────────────────
    const { data: config } = await supabase
      .from('bar_config_nfce')
      .select('*')
      .maybeSingle()

    if (!config?.ativo) {
      return NextResponse.json({ erro: 'NFC-e não configurada ou desativada.' }, { status: 400 })
    }

    // ── Busca pedido com itens e pagamentos ───────────────────
    const { data: pedido, error: errPedido } = await supabase
      .from('bar_pedidos')
      .select(`
        *,
        bar_itens_pedido (*),
        bar_pagamentos (*)
      `)
      .eq('id', pedido_id)
      .single()

    if (errPedido || !pedido) {
      return NextResponse.json({ erro: 'Pedido não encontrado' }, { status: 404 })
    }

    if (pedido.status !== 'pago') {
      return NextResponse.json({ erro: 'Só é possível emitir NFC-e para pedidos pagos' }, { status: 400 })
    }

    // ── Busca ou incrementa próximo número NFC-e ──────────────
    const proximoNumero = config.proximo_numero || 1
    
    // Atualiza próximo número
    await supabase
      .from('bar_config_nfce')
      .update({ proximo_numero: proximoNumero + 1 })
      .eq('id', config.id)

    // ── Monta conteúdo INI da NFC-e ───────────────────────────
    const iniContent = montarININFCe(pedido, config, proximoNumero, cpf_cnpj)

    // ── Conecta ao ACBrMonitor via TCP Socket ─────────────────
    const acbrUrl = config.acbr_url || 'localhost:3434'
    const [host, portStr] = acbrUrl.replace('http://', '').replace('https://', '').split(':')
    const port = parseInt(portStr) || 3434

    const resposta = await enviarComandoACBr(
      host,
      port,
      `NFe.CriarEnviarNFe("${escapeINI(iniContent)}", ${proximoNumero}, 0, 1)`
    )

    // ── Parseia resposta do ACBrMonitor ───────────────────────
    const resultado = parsearRespostaACBr(resposta)

    if (resultado.sucesso) {
      // Atualiza registro NFC-e como autorizada
      if (nfce_id) {
        await supabase
          .from('bar_nfce')
          .update({
            status: 'autorizada',
            numero: proximoNumero,
            serie: config.serie_nfce || '1',
            chave_acesso: resultado.chave_acesso,
            protocolo: resultado.protocolo,
            xml_retorno: resultado.xml,
            mensagem_retorno: resultado.motivo,
            emitido_em: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', nfce_id)
      }

      return NextResponse.json({
        sucesso: true,
        numero: proximoNumero,
        serie: config.serie_nfce || '1',
        chave_acesso: resultado.chave_acesso,
        protocolo: resultado.protocolo,
        motivo: resultado.motivo,
        xml: resultado.xml
      })
    } else {
      // Atualiza como rejeitada
      if (nfce_id) {
        await supabase
          .from('bar_nfce')
          .update({
            status: 'rejeitada',
            mensagem_retorno: resultado.motivo || resposta,
            xml_envio: iniContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', nfce_id)
      }

      return NextResponse.json({
        sucesso: false,
        erro: resultado.motivo || 'Erro na emissão',
        resposta_acbr: resposta
      }, { status: 422 })
    }

  } catch (err: any) {
    console.error('[NFC-e] Erro:', err)

    // Erro de conexão TCP
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      return NextResponse.json({
        sucesso: false,
        erro: 'ACBrMonitor indisponível. Verifique se o serviço está ativo e acessível na rede.',
        detalhes: err.message
      }, { status: 503 })
    }

    return NextResponse.json({
      sucesso: false,
      erro: err.message || 'Erro interno'
    }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════

/**
 * Envia um comando ao ACBrMonitor via TCP Socket e aguarda resposta.
 * O ACBrMonitor responde com "OK:" para sucesso ou "ERRO:" para falha.
 */
function enviarComandoACBr(host: string, port: number, comando: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()
    let buffer = ''
    const timeout = 30000 // 30 segundos

    const timer = setTimeout(() => {
      client.destroy()
      reject(new Error(`Timeout de ${timeout / 1000}s ao aguardar resposta do ACBrMonitor`))
    }, timeout)

    client.connect(port, host, () => {
      // ACBrMonitor espera comando terminado com \r\n (CRLF)
      client.write(comando + '\r\n')
    })

    client.on('data', (data) => {
      buffer += data.toString()
      
      // ACBrMonitor termina a resposta com \x03 (ETX - End of Text)
      if (buffer.includes('\x03')) {
        clearTimeout(timer)
        client.end()
        // Remove o caractere ETX da resposta
        resolve(buffer.replace('\x03', '').trim())
      }
    })

    client.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })

    client.on('close', () => {
      clearTimeout(timer)
      if (buffer) {
        resolve(buffer.trim())
      }
    })
  })
}

/**
 * Monta o conteúdo do arquivo INI no formato esperado pelo ACBrMonitor
 * para uma NFC-e (modelo 65).
 * 
 * Referência: https://acbr.sourceforge.io/ACBrMonitor/ModeloNFeINICompleto.html
 */
function montarININFCe(
  pedido: any,
  config: any,
  numero: number,
  cpfConsumidor?: string
): string {
  const itens = pedido.bar_itens_pedido || []
  const pagamentos = pedido.bar_pagamentos || []
  const agora = new Date()
  
  // Formato de data do ACBr: DD/MM/YYYY HH:MM:SS
  const dhEmi = agora.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  // Gerar cNF aleatório de 8 dígitos
  const cNF = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')

  // Código do município (precisa estar na config ou derivar da UF)
  const cMunFG = config.codigo_municipio || ''

  let ini = ''

  // ── Identificação ─────────────────────────────────────────
  ini += '[infNFe]\n'
  ini += 'versao=4.00\n\n'

  ini += '[Identificacao]\n'
  ini += `cNF=${cNF}\n`
  ini += 'natOp=VENDA\n'
  ini += 'mod=65\n'                    // NFC-e = modelo 65
  ini += `serie=${config.serie_nfce || '1'}\n`
  ini += `nNF=${String(numero).padStart(9, '0')}\n`
  ini += `dhEmi=${dhEmi}\n`
  ini += 'tpNF=1\n'                    // 1 = Saída
  ini += 'idDest=1\n'                  // 1 = Operação interna
  ini += `tpAmb=${config.ambiente === 1 ? '1' : '2'}\n`  // 1=Produção, 2=Homologação
  ini += 'tpImp=4\n'                   // 4 = DANFE NFC-e
  ini += 'tpEmis=1\n'                  // 1 = Emissão normal
  ini += 'finNFe=1\n'                  // 1 = NF-e normal
  ini += 'indFinal=1\n'               // 1 = Consumidor final
  ini += 'indPres=1\n'                // 1 = Operação presencial
  ini += 'procEmi=0\n'                // 0 = Emissão por aplicativo contribuinte
  if (cMunFG) ini += `cMunFG=${cMunFG}\n`
  ini += 'verProc=SistemaClube1.0\n\n'

  // ── Emitente ──────────────────────────────────────────────
  ini += '[Emitente]\n'
  ini += `CRT=${config.crt || 1}\n`
  ini += `CNPJCPF=${limparDoc(config.cnpj_emitente || '')}\n`
  ini += `xNome=${config.razao_social || ''}\n`
  ini += `xFant=${config.nome_fantasia || config.razao_social || ''}\n`
  ini += `IE=${config.inscricao_estadual || ''}\n`
  if (config.endereco_logradouro) ini += `xLgr=${config.endereco_logradouro}\n`
  if (config.endereco_numero) ini += `nro=${config.endereco_numero}\n`
  if (config.endereco_complemento) ini += `xCpl=${config.endereco_complemento}\n`
  if (config.endereco_bairro) ini += `xBairro=${config.endereco_bairro}\n`
  if (config.codigo_municipio) ini += `cMun=${config.codigo_municipio}\n`
  if (config.endereco_municipio) ini += `xMun=${config.endereco_municipio}\n`
  if (config.uf) {
    ini += `UF=${config.uf}\n`
    ini += `cUF=${getCodigoUF(config.uf)}\n`
  }
  if (config.endereco_cep) ini += `CEP=${config.endereco_cep}\n`
  ini += 'cPais=1058\n'
  ini += 'xPais=BRASIL\n\n'

  // ── Destinatário (NFC-e: opcional, só se CPF informado) ───
  if (cpfConsumidor) {
    ini += '[Destinatario]\n'
    ini += `CNPJCPF=${limparDoc(cpfConsumidor)}\n`
    ini += 'indIEDest=9\n'            // 9 = Não contribuinte
    ini += '\n'
  }

  // ── Produtos/Itens ────────────────────────────────────────
  let vTotalProd = 0
  let vTotalDesc = 0

  itens.forEach((item: any, idx: number) => {
    const num = String(idx + 1).padStart(3, '0')
    const vProd = Number(item.quantidade) * Number(item.preco_unitario)
    vTotalProd += vProd

    ini += `[Produto${num}]\n`
    ini += `cProd=${item.produto_id?.substring(0, 20) || String(idx + 1)}\n`
    ini += 'cEAN=SEM GTIN\n'
    ini += `xProd=${item.nome_produto || item.produto_nome || 'PRODUTO'}\n`
    ini += `NCM=${item.produto_ncm || '22030000'}\n`    // Padrão: cerveja
    ini += `CFOP=${item.produto_cfop || '5102'}\n`      // Padrão: venda mercadoria adquirida
    ini += `uCom=${item.produto_unidade || 'UN'}\n`
    ini += `qCom=${Number(item.quantidade).toFixed(4)}\n`
    ini += `vUnCom=${Number(item.preco_unitario).toFixed(4)}\n`
    ini += `vProd=${vProd.toFixed(2)}\n`
    ini += 'cEANTrib=SEM GTIN\n'
    ini += `uTrib=${item.produto_unidade || 'UN'}\n`
    ini += `qTrib=${Number(item.quantidade).toFixed(4)}\n`
    ini += `vUnTrib=${Number(item.preco_unitario).toFixed(4)}\n`
    ini += 'indTot=1\n'
    ini += 'vFrete=0.00\n'
    ini += 'vSeg=0.00\n'
    ini += 'vDesc=0.00\n'
    ini += 'vOutro=0.00\n\n'

    // ── ICMS do item ──────────────────────────────────────
    const crt = config.crt || 1
    
    ini += `[ICMS${num}]\n`
    ini += 'orig=0\n'                  // 0 = Nacional

    if (crt === 1 || crt === 2 || crt === 4) {
      // Simples Nacional
      const csosn = item.produto_cst || '102'
      ini += `CSOSN=${csosn}\n`
      
      if (csosn === '500') {
        // ICMS ST cobrado anteriormente
        ini += 'vBCSTRet=0.00\n'
        ini += 'vICMSSTRet=0.00\n'
        ini += 'pST=0.00\n'
        ini += 'vBCFCPSTRet=0.00\n'
        ini += 'pFCPSTRet=0.00\n'
        ini += 'vFCPSTRet=0.00\n'
      }
    } else {
      // Regime Normal
      const cst = item.produto_cst || '00'
      ini += `CST=${cst}\n`
      
      if (cst === '00') {
        ini += 'modBC=0\n'
        ini += `vBC=${vProd.toFixed(2)}\n`
        ini += 'pICMS=0.00\n'
        ini += 'vICMS=0.00\n'
      }
    }
    ini += '\n'

    // ── PIS do item ───────────────────────────────────────
    ini += `[PIS${num}]\n`
    ini += 'CST=49\n'                  // 49 = Outras operações de saída
    ini += 'vBC=0.00\n'
    ini += 'pPIS=0.00\n'
    ini += 'vPIS=0.00\n\n'

    // ── COFINS do item ────────────────────────────────────
    ini += `[COFINS${num}]\n`
    ini += 'CST=49\n'                  // 49 = Outras operações de saída
    ini += 'vBC=0.00\n'
    ini += 'pCOFINS=0.00\n'
    ini += 'vCOFINS=0.00\n\n'
  })

  // ── Total ─────────────────────────────────────────────────
  const vDesc = Number(pedido.desconto) || 0
  const vNF = vTotalProd - vDesc

  ini += '[Total]\n'
  ini += `vProd=${vTotalProd.toFixed(2)}\n`
  ini += `vDesc=${vDesc.toFixed(2)}\n`
  ini += `vNF=${vNF.toFixed(2)}\n`
  ini += 'vBC=0.00\n'
  ini += 'vICMS=0.00\n'
  ini += 'vICMSDeson=0.00\n'
  ini += 'vBCST=0.00\n'
  ini += 'vST=0.00\n'
  ini += 'vFrete=0.00\n'
  ini += 'vSeg=0.00\n'
  ini += 'vOutro=0.00\n'
  ini += 'vII=0.00\n'
  ini += 'vIPI=0.00\n'
  ini += 'vPIS=0.00\n'
  ini += 'vCOFINS=0.00\n\n'

  // ── Transportador (NFC-e: sem frete) ──────────────────────
  ini += '[Transportador]\n'
  ini += 'modFrete=9\n\n'             // 9 = Sem frete

  // ── Pagamentos ────────────────────────────────────────────
  const mapaFormaPag: Record<string, string> = {
    'dinheiro': '01',           // Dinheiro
    'cartao_credito': '03',     // Cartão de Crédito
    'cartao_debito': '04',      // Cartão de Débito
    'pix': '17',                // Pagamento Instantâneo (PIX)
    'carteirinha': '05',        // Crédito Loja (carteirinha do clube)
    'cortesia': '90'            // Sem pagamento
  }

  // Calcula troco total
  let vTroco = 0
  pagamentos.forEach((pag: any) => {
    if (pag.troco && Number(pag.troco) > 0) {
      vTroco += Number(pag.troco)
    }
  })

  pagamentos.forEach((pag: any, idx: number) => {
    const num = String(idx + 1).padStart(3, '0')
    const tPag = mapaFormaPag[pag.forma_pagamento] || '99'
    const isUltimo = idx === pagamentos.length - 1

    ini += `[pag${num}]\n`
    ini += `tPag=${tPag}\n`
    ini += `vPag=${Number(pag.valor).toFixed(2)}\n`
    ini += 'indPag=0\n'                // 0 = Pagamento à vista

    // Cartão: dados adicionais
    if (['03', '04'].includes(tPag)) {
      ini += 'tpIntegra=2\n'          // 2 = Não integrado
    }

    // vTroco vai no último grupo [pag] conforme layout ACBr
    if (isUltimo && vTroco > 0) {
      ini += `vTroco=${vTroco.toFixed(2)}\n`
    }

    ini += '\n'
  })

  // ── Informações Adicionais ────────────────────────────────
  ini += '[DadosAdicionais]\n'
  ini += 'infCpl=Venda realizada pelo Sistema Clube\n\n'

  // ── Responsável Técnico (opcional) ────────────────────────
  if (config.resp_tec_cnpj) {
    ini += '[infRespTec]\n'
    ini += `CNPJ=${limparDoc(config.resp_tec_cnpj)}\n`
    ini += `xContato=${config.resp_tec_contato || ''}\n`
    ini += `email=${config.resp_tec_email || ''}\n`
    ini += `fone=${config.resp_tec_fone || ''}\n\n`
  }

  return ini
}

/**
 * Parseia a resposta do ACBrMonitor.
 * 
 * Respostas do ACBrMonitor começam com:
 *   - "OK:" para sucesso
 *   - "ERRO:" para falhas
 * 
 * Para NFe.CriarEnviarNFe, resposta de sucesso contém (quando TipoResposta=INI):
 *   [Retorno]
 *   CStat=100
 *   XMotivo=Autorizado o uso da NF-e
 *   NProt=...
 *   ChNFe=...
 *   XML=caminho_do_xml
 */
function parsearRespostaACBr(resposta: string): {
  sucesso: boolean
  chave_acesso?: string
  protocolo?: string
  motivo?: string
  xml?: string
  cstat?: string
} {
  // Verifica se é resposta de sucesso
  if (resposta.startsWith('OK:')) {
    const conteudo = resposta.substring(3).trim()
    
    // Tenta extrair campos no formato INI
    const chave = extrairCampo(conteudo, 'ChNFe')
    const protocolo = extrairCampo(conteudo, 'NProt')
    const motivo = extrairCampo(conteudo, 'XMotivo')
    const cstat = extrairCampo(conteudo, 'CStat')
    const xml = extrairCampo(conteudo, 'XML') || extrairCampo(conteudo, 'Arquivo')

    // CStat 100 = Autorizado uso da NF-e
    // CStat 150 = Autorizado uso da NF-e fora de prazo
    const autorizado = cstat === '100' || cstat === '150' || !!chave

    return {
      sucesso: autorizado,
      chave_acesso: chave,
      protocolo,
      motivo: motivo || (autorizado ? 'Autorizado o uso da NF-e' : conteudo),
      xml,
      cstat
    }
  }

  // Resposta de erro
  const erroMsg = resposta.startsWith('ERRO:')
    ? resposta.substring(5).trim()
    : resposta

  return {
    sucesso: false,
    motivo: erroMsg,
    cstat: extrairCampo(resposta, 'CStat')
  }
}

/**
 * Extrai um campo no formato "Campo=Valor" de uma string.
 */
function extrairCampo(texto: string, campo: string): string | undefined {
  // Busca padrão Campo=Valor (case insensitive)
  const regex = new RegExp(`${campo}=(.+?)(?:\\r?\\n|$)`, 'i')
  const match = texto.match(regex)
  return match ? match[1].trim() : undefined
}

/**
 * Escape de aspas duplas no conteúdo INI para envio via comando ACBr.
 * O ACBr aceita o INI entre aspas duplas, então aspas internas precisam ser escapadas.
 */
function escapeINI(ini: string): string {
  return ini.replace(/"/g, '""')
}

/**
 * Remove pontuação de CNPJ/CPF.
 */
function limparDoc(doc: string): string {
  return doc.replace(/[.\-\/]/g, '')
}

/**
 * Retorna o código IBGE da UF.
 */
function getCodigoUF(uf: string): string {
  const codigos: Record<string, string> = {
    'RO': '11', 'AC': '12', 'AM': '13', 'RR': '14', 'PA': '15',
    'AP': '16', 'TO': '17', 'MA': '21', 'PI': '22', 'CE': '23',
    'RN': '24', 'PB': '25', 'PE': '26', 'AL': '27', 'SE': '28',
    'BA': '29', 'MG': '31', 'ES': '32', 'RJ': '33', 'SP': '35',
    'PR': '41', 'SC': '42', 'RS': '43', 'MS': '50', 'MT': '51',
    'GO': '52', 'DF': '53'
  }
  return codigos[uf.toUpperCase()] || '35'
}

// ═══════════════════════════════════════════════════════════════
// ENDPOINTS ADICIONAIS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/bar/nfce/emitir?acao=status
 * Verifica status de conexão com ACBrMonitor
 */
export async function GET(req: NextRequest) {
  const acao = req.nextUrl.searchParams.get('acao')

  if (acao === 'status') {
    try {
      const { data: config } = await supabase
        .from('bar_config_nfce')
        .select('acbr_url, ativo')
        .maybeSingle()

      if (!config?.ativo) {
        return NextResponse.json({ status: 'desativado' })
      }

      const acbrUrl = config.acbr_url || 'localhost:3434'
      const [host, portStr] = acbrUrl.replace('http://', '').replace('https://', '').split(':')
      const port = parseInt(portStr) || 3434

      // Testa conexão com comando simples
      const resposta = await enviarComandoACBr(host, port, 'NFe.StatusServico')
      
      return NextResponse.json({
        status: 'conectado',
        resposta: resposta.substring(0, 200) // Limita tamanho
      })
    } catch (err: any) {
      return NextResponse.json({
        status: 'erro',
        mensagem: err.message
      }, { status: 503 })
    }
  }

  return NextResponse.json({ erro: 'Ação não reconhecida' }, { status: 400 })
}
