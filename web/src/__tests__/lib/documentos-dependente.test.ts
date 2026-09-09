import { DOCUMENTACAO_VAZIA, validarDocumentacao, idadeDependente } from '@/lib/documentos-dependente'
const docs = {...DOCUMENTACAO_VAZIA,certidao_nascimento_path:'birth.pdf'}
test('21 anos inclusive não exige faculdade',()=>expect(validarDocumentacao('filho','2005-09-07',docs,'2026-09-07')).toBeNull())
test('22 anos exige matrícula',()=>expect(validarDocumentacao('filho','2004-09-07',docs,'2026-09-07')).toMatch(/matrícula/))
test('universitário de 40 anos pode permanecer com comprovante válido',()=>expect(validarDocumentacao('filho_universitario','1986-09-07',{...docs,comprovante_matricula_path:'college.pdf',instituicao_ensino:'Faculdade teste',matricula_valida_ate:'2026-12-31'},'2026-09-07')).toBeNull())
test('comprovante vencido não permite permanência',()=>expect(validarDocumentacao('filho','1986-09-07',{...docs,comprovante_matricula_path:'college.pdf',instituicao_ensino:'Teste',matricula_valida_ate:'2026-09-06'},'2026-09-07')).toMatch(/validade/))
test('idade respeita dia do aniversário',()=>expect(idadeDependente('2004-09-08','2026-09-07')).toBe(21))
test('cônjuge não tem limite de idade',()=>expect(validarDocumentacao('conjuge','1960-01-01',{...DOCUMENTACAO_VAZIA,certidao_casamento_path:'marriage.pdf'},'2026-09-07')).toBeNull())
