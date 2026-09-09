# Atualização de sessão e Realtime

A stack candidata `web-redis.portainer.realtime.yml` mantém Redis e o worker e acrescenta `web-proxy`. O acesso continua em http://localhost:3000. A porta 3000 fica no proxy; o serviço sistema-clube fica acessível pela rede interna.

No Portainer, abra a stack sistema_clube, substitua o conteúdo do Editor pelo arquivo candidato e use Update the stack, com a opção de baixar imagens desativada. As imagens são locais:

- sistema-clube:local-sessao-realtime-20260907
- sistema-clube:proxy-realtime-20260907

Depois, feche as abas antigas do sistema, abra novamente e entre com seu usuário. Em Configurações, WhatsApp Oficial (Meta) fica ao lado de WaSenderAPI. Enquanto não houver configuração WaSender, a página WhatsApp apresenta os atalhos de configuração.

O gateway Supabase recebeu a correção do nome do servidor Realtime. A imagem local clube-supabase-api-gw:local-20260907 também foi reconstruída com essa correção para futuras recriações.

Validação: sete testes automatizados passaram, incluindo concorrência do bloqueio de sessão e credenciais do teste de provedor. Pelo proxy temporário, login e recebimento de um INSERT via Realtime passaram. A primeira tentativa de evento ocorreu durante a criação do slot de replicação; a repetição passou. Nenhuma mensagem WhatsApp foi enviada. Os testes do bloqueio usam simulação de LockManager; o Firefox ainda precisa ser conferido após a atualização.

Para voltar à versão anterior, utilize a stack original web-redis.portainer.yml (imagem local-config-meta-20260907, porta 3000 no sistema-clube), removendo o serviço web-proxy para liberar a porta. Os volumes do banco e Redis devem ser preservados.
