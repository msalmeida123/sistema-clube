import { escapeHtml } from './security'
import { dataDocumento } from './impressao-documento'
import { hojeBrasil } from './documentos-dependente'
import { formatCPF } from './utils'

export function validarConviteImpressao(convite: { status: string; data_validade: string; qr_code: string }) {
  if (!['pago','ativo'].includes(convite.status)) throw new Error('Convite cancelado, utilizado ou ainda não liberado.')
  if (!convite.data_validade || convite.data_validade < hojeBrasil()) throw new Error('Este convite está vencido.')
  if (!convite.qr_code?.trim()) throw new Error('Convite sem QR Code cadastrado.')
}

export function conteudoConvite(convite: any, qrData: string) {
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(qrData)) throw new Error('Imagem QR inválida')
  return `<section class="convite"><h1 class="text-center">CONVITE DE VISITA</h1>
  <p><strong>Convidado:</strong> ${escapeHtml(convite.convidado_nome || '')}</p>
  <p><strong>CPF:</strong> ${escapeHtml(formatCPF(convite.convidado_cpf))}</p>
  <p><strong>Associado responsável:</strong> ${escapeHtml(convite.associado?.nome || 'Não informado')}</p>
  <p><strong>Título:</strong> ${escapeHtml(String(convite.associado?.numero_titulo || 'Não informado'))}</p>
  <h2 class="text-center">Data da visita: ${dataDocumento(convite.data_validade)}</h2>
  <div class="qrcode"><img src="${qrData}" alt="QR Code do convite"><p>${escapeHtml(convite.qr_code)}</p></div>
  <p>Apresente este convite e um documento com foto na portaria. Válido somente na data indicada, sujeito à conferência na entrada.</p></section>`
}
