import {cnpjValido} from './cnpj'
export function formatarCpf(valor:string){
 return valor.replace(/\D/g,'').slice(0,11).replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/,'$1.$2.$3-$4')
}
export function formatarRg(valor:string){
 const caracteres=valor.toUpperCase().replace(/[^0-9X]/g,'')
 let rg=''
 for(const c of Array.from(caracteres)){
  if(rg.length>=9)break
  if(c!=='X'||rg.length===8)rg+=c
 }
 return rg.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/^(\d{2})\.(\d{3})\.(\d{3})([0-9X])/,'$1.$2.$3-$4')
}
export const limitesAssociado:Record<string,number>={nome:200,nome_fantasia:200,cnpj:18,cpf:14,rg:12,titulo_eleitor:20,email:200,telefone:20,cep:10,endereco:200,numero:20,complemento:100,bairro:100,cidade:100,estado:2}
export function erroCampoAssociado(nome:string,valor:string,badInput=false){
 const v=valor.trim()
 if(badInput)return nome==='data_nascimento'?'Informe uma data válida.':'Confira o valor informado.'
 if(['sexo','nome', 'cpf', 'cnpj', 'plano', 'tipo_cadastro', 'tipo_residencia', 'rg', 'titulo_eleitor', 'data_nascimento', 'email', 'telefone', 'cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado', 'nome_fantasia','status'].includes(nome)&&!v)return 'Preencha este campo.'
 if(limitesAssociado[nome]&&valor.length>limitesAssociado[nome])return `Use no máximo ${limitesAssociado[nome]} caracteres.`
 if(!v)return ''
 if(nome==='sexo'&&!['feminino','masculino','nao_informar'].includes(v))return 'Selecione uma opção válida.'
 if(nome==='cnpj'&&!cnpjValido(v))return 'CNPJ inválido. Confira os caracteres e os dígitos verificadores.'
 if(nome==='cpf'&&!/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(v))return 'Informe os 11 números do CPF.'
 if(nome==='rg'&&!/^(?:\d{8}[0-9X]|\d{2}\.\d{3}\.\d{3}-[0-9X])$/i.test(v))return 'Informe 9 caracteres: 8 números e o final numérico ou X (12.345.678-9).'
 if(nome==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return 'Informe um e-mail válido, como nome@exemplo.com.'
 if(nome==='cep'&&!/^\d{5}-?\d{3}$/.test(v))return 'Informe os 8 números do CEP.'
 if(nome==='estado'&&!['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].includes(v.toUpperCase()))return 'Informe a sigla do estado, como SP.'
 if(nome==='data_nascimento'){
  const d=new Date(v+'T12:00:00Z')
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==v)return 'Informe uma data válida.'
 }
 return ''
}
export function campoErroBancoAssociado(error:any):{campo:string;mensagem:string}|null{
 const obrigatorio=/^cadastro_obrigatorio:([a-z_]+)$/.exec(String(error?.message||''))
 if(error?.code==='23514'&&obrigatorio&&['sexo','nome', 'cpf', 'cnpj', 'plano', 'tipo_cadastro', 'tipo_residencia', 'rg', 'titulo_eleitor', 'data_nascimento', 'email', 'telefone', 'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'nome_fantasia', 'empresa_associada_id', 'foto_url','status'].includes(obrigatorio[1]))return {campo:obrigatorio[1]==='foto_url'?'foto':obrigatorio[1],mensagem:'Preencha este campo obrigatório.'}
 if(error?.code==='23505'&&/cnpj/i.test(String(error.message)))return {campo:'cnpj',mensagem:'Esta empresa já está cadastrada com este CNPJ.'}
 if(error?.code==='23505'&&/associados_rg_unico/i.test(String(error.message)+' '+String(error.details)))return {campo:'rg',mensagem:'Este RG já está cadastrado para outro associado.'}
 if(error?.code==='23514'&&/cnpj/i.test(String(error.message)))return {campo:'cnpj',mensagem:'CNPJ inválido. Confira o documento.'}
 if(error?.campo==='foto')return {campo:'foto',mensagem:'Não foi possível enviar a foto. Use JPG, PNG ou WEBP com até 10 MB e tente novamente.'}
 if(error?.code==='23505'&&/cpf/i.test(String(error.message)+' '+String(error.details)))return {campo:'cpf',mensagem:'Este CPF já está cadastrado no clube. Confira os associados e os convites existentes.'}
 if(['22007','22008'].includes(error?.code))return {campo:'data_nascimento',mensagem:'Informe uma data de nascimento válida.'}
 return null
}
