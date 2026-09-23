# Limites de autenticação centralizados no Redis

- Sistema: Envoy encaminha o cluster Auth ao serviço interno `sistema-clube_auth-rate-proxy`, que conta requisições `grant_type=password` antes do Supabase Auth. Inclui acesso pelo domínio Supabase e pelo proxy `/supabase` do painel. Renovação de tokens e demais operações continuam no Auth sem consumir tentativas de senha.
- Associado: `/api/associado-app/auth` usa o mesmo módulo Redis antes de consultar credenciais. As demais operações que usam `app_associado_limite` permanecem no PostgreSQL; não são contadores de login.
- Login: 20 tentativas por conta em janela de 15 minutos, contando também tentativas válidas. Conta normalizada e identificada por SHA-256. Sistema e associado usam escopos distintos. Pedido de senha temporária: 5 por CPF em 15 minutos, contador separado.
- Lua incrementa contador e define expiração atomicamente. Resposta 429 inclui `Retry-After` em segundos. Redis indisponível retorna 503; não há fallback local que permita contornar o limite. Limites nativos do Supabase continuam ativos como proteção adicional.
- Redis existente com volume e AOF; reiniciar aplicação/proxy não zera contadores. Nenhuma senha, token ou identificador em texto puro é escrito nas chaves de rate limit. Prefixo padrão `clube-login-v1`, configurável por `LOGIN_RATE_NAMESPACE` (deve ser consistente entre réplicas).
- Não há publicação de porta do novo proxy. Ele se conecta apenas às redes `supabase_backend` e `sistema-clube_redis`. Destino interno fixo: `http://auth:9999`.

## Arquivos

`source/operacao/login-rate.cjs` implementa o contador compartilhado. `source/operacao/auth-redis-proxy.cjs` protege o Auth. `auth-cds-redis.yaml` troca somente o destino do cluster Auth. `auth-cds-original.yaml` permite reversão do roteamento. O serviço usa a imagem da aplicação, mas inicia exclusivamente o proxy.

## Verificação

- `node --test operacao/login-rate.test.cjs`
- `npx jest --config jest.upgrade.config.cjs --runInBand --testMatch '**/login-redis-route.test.ts'`
- `operacao/login-rate.integration.cjs`: teste de 30 acessos concorrentes, isolamento e expiração, com namespace temporário. Não altera contadores de contas reais.

Para futuras instalações, aplicar o serviço `auth-rate-proxy` do compose do sistema e a configuração CDS ao Envoy do Supabase. Não restaurar o CDS anterior sem considerar que isso retira o limite Redis do login administrativo.
