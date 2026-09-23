import {formatarRg,formatarCpf,erroCampoAssociado,campoErroBancoAssociado} from '@/lib/validacao-associado'
test('mascara CPF durante digitacao e colagem',()=>{expect(formatarCpf('123')).toBe('123');expect(formatarCpf('1234')).toBe('123.4');expect(formatarCpf('1234567')).toBe('123.456.7');expect(formatarCpf('12345678901')).toBe('123.456.789-01');expect(formatarCpf('123.456.789-01')).toBe('123.456.789-01');expect(formatarCpf('abc1234567890123')).toBe('123.456.789-01')})
test('CPF incompleto destaca erro e formatado completo passa',()=>{expect(erroCampoAssociado('cpf','123')).toBeTruthy();expect(erroCampoAssociado('cpf','123.456.789-01')).toBe('')})
test('data obrigatoria rejeita vazio e data impossivel',()=>{expect(erroCampoAssociado('data_nascimento','')).toBeTruthy();expect(erroCampoAssociado('data_nascimento','2025-02-30')).toBeTruthy();expect(erroCampoAssociado('data_nascimento','2024-02-29')).toBe('');expect(erroCampoAssociado('data_nascimento','',true)).toBeTruthy()})
test('nome vazio, email, CEP e UF invalidos indicam campo',()=>{for(const [n,v] of [['nome','  '],['email','sem-arroba'],['cep','123'],['estado','XX']])expect(erroCampoAssociado(n,v)).toBeTruthy()})
test('campos aplicáveis vazios impedem salvar',()=>{for(const n of ['nome', 'cpf', 'cnpj', 'plano', 'tipo_cadastro', 'tipo_residencia', 'rg', 'titulo_eleitor', 'data_nascimento', 'email', 'telefone', 'cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado', 'nome_fantasia', 'empresa_associada_id']){expect(erroCampoAssociado(n,'')).toBeTruthy();expect(erroCampoAssociado(n,'  ')).toBeTruthy()}})
test('erro de CPF duplicado aponta campo sem expor detalhes banco',()=>{expect(campoErroBancoAssociado({code:'23505',message:'associados_cpf_key'})).toMatchObject({campo:'cpf'});expect(campoErroBancoAssociado({code:'23505',message:'outro_indice'})).toBeNull()})

test('RG duplicado destaca RG sem confundir com CPF',()=>{expect(campoErroBancoAssociado({code:'23505',message:'duplicate key violates unique constraint associados_rg_unico'})).toEqual({campo:'rg',mensagem:'Este RG já está cadastrado para outro associado.'});expect(campoErroBancoAssociado({code:'23505',message:'outro_indice'})).toBeNull()})

test('erro do banco aponta foto e demais campos obrigatórios',()=>{expect(campoErroBancoAssociado({code:'23514',message:'cadastro_obrigatorio:foto_url'})).toMatchObject({campo:'foto'});expect(campoErroBancoAssociado({code:'23514',message:'cadastro_obrigatorio:empresa_associada_id'})).toMatchObject({campo:'empresa_associada_id'});expect(campoErroBancoAssociado({code:'23514',message:'cadastro_obrigatorio:segredo'})).toBeNull()})

test('RG limita colagem, formata progressivamente e permite X apenas no final',()=>{
 expect(formatarRg('123')).toBe('12.3')
 expect(formatarRg('123456')).toBe('12.345.6')
 expect(formatarRg('12345678911111')).toBe('12.345.678-9')
 expect(formatarRg('12.345.678-x')).toBe('12.345.678-X')
 expect(formatarRg('X12345678X')).toBe('12.345.678-X')
 expect(formatarRg('abc123456789')).toBe('12.345.678-9')
})
test('RG incompleto ou longo impede salvar; nove caracteres com final X passam',()=>{
 for(const rg of ['123','12345678','1234567890','1234567X9','12.345.678-A'])expect(erroCampoAssociado('rg',rg)).toBeTruthy()
 for(const rg of ['123456789','12.345.678-9','12.345.678-X','12345678x'])expect(erroCampoAssociado('rg',rg)).toBe('')
})

test('complemento é opcional mas mantém limite de tamanho',()=>{expect(erroCampoAssociado('complemento','')).toBe('');expect(erroCampoAssociado('complemento','  ')).toBe('');expect(erroCampoAssociado('complemento','Sala 1')).toBe('');expect(erroCampoAssociado('complemento','a'.repeat(101))).toBeTruthy()})

test('sexo obrigatório aceita somente as três opções previstas',()=>{for(const s of ['', 'outro'])expect(erroCampoAssociado('sexo',s)).toBeTruthy();for(const s of ['feminino','masculino','nao_informar'])expect(erroCampoAssociado('sexo',s)).toBe('');expect(campoErroBancoAssociado({code:'23514',message:'cadastro_obrigatorio:sexo'})).toMatchObject({campo:'sexo'})})
