import {planoParaBanco,planoParaTela,listarPlanos} from '@/lib/planos-cadastro'
test('exibe o valor mensal histórico do plano existente',()=>{
 expect(planoParaTela({id:'a',codigo:'ANTIGO',valor_mensal:100,valor_inscricao:20})).toMatchObject({id:'a',codigo:'ANTIGO',valor_mensalidade:100,valor_inscricao:20})
})
test('editar mensalidade preserva código existente e grava na coluna real',()=>{
 const dados=planoParaBanco({nome:' Plano ',valor_mensalidade:150,valor_inscricao:20},'ANTIGO')
 expect(dados).toMatchObject({nome:'Plano',valor_mensal:150,valor_inscricao:20})
 expect(dados).not.toHaveProperty('valor_mensalidade')
 expect(dados).not.toHaveProperty('codigo')
})
test('falha de consulta não vira lista vazia',async()=>{
 const q:any={select:()=>q,order:async()=>({error:Error('consulta'),data:null})}
 await expect(listarPlanos({from:()=>q})).rejects.toThrow('consulta')
})
test('lista planos existentes usando a tabela real',async()=>{
 const q:any={select:()=>q,order:async()=>({error:null,data:[{id:'a',valor_mensal:100}]})}
 const db={from:jest.fn(()=>q)}
 expect(await listarPlanos(db)).toEqual([expect.objectContaining({id:'a',valor_mensalidade:100})])
 expect(db.from).toHaveBeenCalledWith('planos')
})
