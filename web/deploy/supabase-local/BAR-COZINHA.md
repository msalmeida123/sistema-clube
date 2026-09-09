# Bar: produtos, mesas e cozinha

Migração local: `bar-cozinha.sql`, aditiva e reaplicável, já executada nesta instalação.

1. Abra **Produtos do Bar > Novo Produto**. Informe nome, categoria e preço. As categorias Pratos, Lanches, Pizzas, Porções e Sobremesas sugerem a opção de impressão na cozinha; ajuste por produto quando necessário. Bebidas ficam desmarcadas.
2. Abra **Bar/Restaurante**, escolha os produtos e informe o cliente (opcional), mesa ou balcão e observações de preparo.
3. Finalize o pagamento. Clique em **Imprimir Comprovante** para o cliente e **Imprimir Cozinha** para os alimentos. Selecione a impressora apropriada no diálogo do sistema. Não há impressão silenciosa ou confirmação física de impressão.
4. Em **Pedidos do Bar**, abra um pedido para conferir mesa e cliente, imprimir o comprovante ou reimprimir a cozinha. Reimprimir não cria outro pedido; evite produzir duas vezes.

O fluxo atual registra a venda antes de imprimir a comanda; não inclui conta aberta de mesa, envio antes do pagamento ou fila automática de impressão. O modelo e a conexão da impressora ainda precisam ser informados para configurar envio direto.

Produtos antigos não foram reclassificados automaticamente. Edite os alimentos existentes e marque a opção de cozinha. O banco copia esse destino para cada item novo; mudanças futuras no cadastro não alteram a comanda histórica.

Validação: TypeScript, testes de HTML (seleção de alimentos, escaping, balcão e fuso de São Paulo), testes de autorização da rota e transação SQL revertida verificando mesa/cliente e preservação do destino histórico. Nenhuma venda de teste foi mantida; nenhuma impressão física foi realizada.
