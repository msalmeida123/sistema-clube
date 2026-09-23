/** A mensalidade utiliza a coluna histórica, sem duplicar o valor em outra tabela. */
export function planoParaTela(plano: any) {
 return {...plano, valor_mensalidade: Number(plano.valor_mensal), valor_inscricao: plano.valor_inscricao ?? 0}
}
export function planoParaBanco(form: any, codigo?: string) {
 const {valor_mensalidade,...dados}=form
 return {...dados, nome:form.nome.trim(), valor_mensal:valor_mensalidade,
  ...(!codigo ? {codigo:'PL-'+crypto.randomUUID()} : {}),
  updated_at:new Date().toISOString()}
}
export async function listarPlanos(db: any) {
 const {data,error}=await db.from('planos').select('*').order('ordem',{ascending:true})
 if(error)throw error
 return (data||[]).map(planoParaTela)
}
