# Busca por QR da carteirinha

Imagem local: sistema-clube:local-qr-20260907. Inclui documentos de dependentes.

1. Portainer: altere a imagem da stack sistema_clube e atualize sem baixar novamente do registro.
2. Abra o associado, gere novamente a carteirinha e use o novo QR. As versões anteriores geravam Base64 com data/hora e precisam ser reimpressas.
3. Na portaria, clique no campo de leitura e escaneie com leitor USB configurado como teclado. Se o leitor não enviar Enter, pressione Enter ou clique na lupa.
4. Sem leitor: cole SOCIO-TESTE-990001 para testar o associado Ana do seed (a consulta pode registrar entrada se estiver regular).
5. Dependentes: o QR está na tela de detalhes. A portaria verifica documentos, matrícula quando exigida, titular ativo e mensalidades do titular. Cadastros de teste incompletos serão recusados até regularização.

Código cadastrado é preservado. Quando não há QR salvo, usa SOCIO-UUID ou DEP-UUID estável; não inclui CPF. QR desconhecido não é convertido em título pela extração de dígitos. Consultas com erro e falha no registro da entrada não exibem liberação.

Validação: 11 testes unitários, TypeScript e teste transacional de registro no banco local. Leitor físico não testado. Não foi adicionada leitura por câmera.
