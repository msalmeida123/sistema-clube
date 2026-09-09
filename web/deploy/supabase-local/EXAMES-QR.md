# QR Code no cadastro de exame médico

Imagem local: sistema-clube:local-exames-qr-20260907.

Atualize a imagem do serviço na stack sistema_clube pelo Portainer, sem baixar novamente do registro.

Na tela Exames Médicos > Novo, a consulta inicia em QR Code da carteirinha. Clique no campo e leia com scanner USB; Enter ou Buscar selecionam o associado. A consulta é somente leitura: não registra entrada, não grava nem aprova o exame. Os dados do exame continuam preenchidos e salvos separadamente.

Nome ou CPF continuam disponíveis no seletor. Erros de conexão, código não encontrado e associado inativo são exibidos sem selecionar outra pessoa. A tela atual registra exames de associados; não vincula QR de dependente ao titular.

Validação: TypeScript e cinco testes de consulta exata, fallback estável, QR substituído, código desconhecido e erro de banco. Leitor físico e interação no navegador ainda não testados.
