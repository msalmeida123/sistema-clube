export const DOCUMENTOS_DEPENDENTE = [
  ['documento_complementar_path', 'Documento complementar (adoção, óbito ou vínculo familiar)'],
  ['certidao_nascimento_path', 'Certidão de nascimento'],
  ['certidao_casamento_path', 'Certidão de casamento'],
  ['comprovante_matricula_path', 'Comprovante de matrícula na faculdade'],
] as const
export type CampoDocumento = typeof DOCUMENTOS_DEPENDENTE[number][0]
export type DocumentacaoDependente = Record<CampoDocumento, string> & { matricula_valida_ate: string; instituicao_ensino: string }
export const DOCUMENTACAO_VAZIA: DocumentacaoDependente = {
  documento_complementar_path: '', certidao_nascimento_path: '', certidao_casamento_path: '', comprovante_matricula_path: '', matricula_valida_ate: '', instituicao_ensino: '',
}
export function idadeDependente(nascimento: string, hoje: string) {
  const [ano, mes, dia] = nascimento.split('-').map(Number)
  const [a, m, d] = hoje.split('-').map(Number)
  return a - ano - (m < mes || (m === mes && d < dia) ? 1 : 0)
}
export function validarDocumentacao(parentesco: string, nascimento: string, docs: DocumentacaoDependente, hoje: string) {
  if (nascimento && (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento) || nascimento > hoje || !Number.isFinite(Date.parse(nascimento)))) return 'Informe uma data de nascimento válida.'
  if (['pai','mae','sogra','adotado'].includes(parentesco) && !docs.documento_complementar_path) return 'Anexe o documento complementar de vínculo familiar.'
  if (parentesco === 'enteado' && !docs.certidao_casamento_path) return 'Anexe a certidão de casamento.'
  const filho = ['filho','filha','filho_universitario','enteado','adotado'].includes(parentesco)
  if (filho && !nascimento) return 'Informe a data de nascimento.'
  if (filho && !docs.certidao_nascimento_path) return 'Anexe a certidão de nascimento.'
  if (parentesco === 'conjuge' && !docs.certidao_casamento_path) return 'Anexe a certidão de casamento.'
  if (filho && (parentesco === 'filho_universitario' || idadeDependente(nascimento, hoje) > 21)) {
    if (!docs.comprovante_matricula_path) return 'Após os 21 anos, é necessário comprovante de matrícula na faculdade.'
    if (!docs.matricula_valida_ate || docs.matricula_valida_ate < hoje) return 'Informe a validade atual do comprovante de matrícula.'
    if (!docs.instituicao_ensino.trim()) return 'Informe a faculdade.'
  }
  return null
}
export function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
}
