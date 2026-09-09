# Configuração de RH e impressão

Em Recursos Humanos > Configuração do RH, informe nome/documento da empresa para os impressos e os dados do Control iD iDClass 373: nome, IPv4 local, protocolo, porta, usuário e senha. A API oficial usa HTTPS na porta 443 por padrão. Confirme os valores efetivos na tela do equipamento. Se ele utilizar certificado próprio, habilite a opção apenas para esse aparelho.

Salvar configuração persiste os dados. Senha vazia mantém a senha existente. Apenas administradores podem salvar ou testar; a senha nunca é devolvida ao navegador. A tabela rh_configuracao tem acesso direto negado a anon/authenticated. O servidor precisa alcançar a rede local do relógio a partir do Docker.

Testar conexão executa login.fcgi, get_about.fcgi e logout.fcgi. Não altera funcionários, digitais, horário ou marcações. Não há sincronização automática nem importação de AFD nesta entrega. A conexão física depende do IP e das credenciais locais; foi testada por simulação da API, não com o hardware.

Em Folha de Pagamento, selecione a competência/status e clique em Imprimir folha. Para o demonstrativo individual, use o ícone da impressora ou Detalhes > Imprimir demonstrativo. A impressão A4 abre em nova janela e permite imprimir ou salvar como PDF. Os valores são lidos novamente do banco; não são recalculados. O status da folha aparece no documento e a impressão não confirma pagamento. A identificação da empresa vem da configuração do RH.

## Portainer

Migração rh-configuracao.sql já aplicada no Supabase local. Para outra instalação, aplique a migração primeiro. Atualize a stack existente usando web-redis.portainer.rh.yml, sem baixar novamente imagens. Imagem: sistema-clube:local-rh-ponto-folha-20260908. Mantém os serviços Redis e a configuração de cores do Kanban.

## Referências técnicas

- https://www.controlid.com.br/relogio-de-ponto/idclass-373/
- https://www.controlid.com.br/suporte/api_idclass_latest.html

A entrega não altera as regras de cálculo da folha nem faz avaliação de conformidade trabalhista do equipamento.
