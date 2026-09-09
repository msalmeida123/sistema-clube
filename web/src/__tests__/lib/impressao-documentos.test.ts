import { dataDocumento, htmlDocumento } from '@/lib/impressao-documento'
import { conteudoConvite, validarConviteImpressao } from '@/lib/convite-impressao'
const convite = { status:'pago', data_validade:'2099-12-31', qr_code:'CONV-TESTE', convidado_nome:'Ana <script>', convidado_cpf:'11111111111', associado:{nome:'Responsável & teste',numero_titulo:'000123'} }
test('datas civis não recuam um dia pelo fuso',()=>{expect(dataDocumento('2026-09-07')).toBe('07/09/2026');expect(dataDocumento(null)).toBe('Não informado')})
test('impressão A4 preserva conteúdo e assinatura sem redução para imagem',()=>{
  const html=htmlDocumento('<contrato>', '<h1>Contrato</h1><div class="assinaturas">Assinatura do associado</div>')
  expect(html).toContain('size:A4')
  expect(html).toContain('Assinatura do associado')
  expect(html).toContain('&lt;contrato&gt;')
  expect(html).not.toContain('canvas')
})
test('convite inclui QR imagem e código cadastrado, data e título, escapando dados',()=>{
  const html=conteudoConvite(convite,'data:image/png;base64,YQ==')
  expect(html).toContain('<img src="data:image/png;')
  expect(html).toContain('CONV-TESTE')
  expect(html).toContain('31/12/2099')
  expect(html).toContain('000123')
  expect(html).not.toContain('<script>')
  expect(html).toContain('&amp;')
})
test.each(['cancelado','utilizado','pendente'])('não emite via válida para status %s', status=>expect(()=>validarConviteImpressao({...convite,status})).toThrow())
test('recusa convite expirado ou sem QR',()=>{
  expect(()=>validarConviteImpressao({...convite,data_validade:'2000-01-01'})).toThrow()
  expect(()=>validarConviteImpressao({...convite,qr_code:''})).toThrow()
  expect(()=>validarConviteImpressao(convite)).not.toThrow()
})
test('não aceita URL externa como imagem do QR',()=>expect(()=>conteudoConvite(convite,'https://example.com/a.png')).toThrow())
