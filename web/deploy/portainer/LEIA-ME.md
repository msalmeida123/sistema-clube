# Instalação no Portainer (Docker Swarm)

Imagem: sistema-clube:revisao-20260907. Inclui as correções locais ainda não commitadas.

1. Copie sistema-clube-revisao-20260907.tar ao nó que executará o sistema e importe:
   docker load -i sistema-clube-revisao-20260907.tar
2. Na stack existente do Portainer, substitua somente o serviço sistema-clube pelo serviço de stack.yml. Preserve app-associado e demais serviços. Não crie outra stack com o mesmo roteador/domínio.
3. Cadastre as variáveis da stack:
   - CLUBE_NODE_HOSTNAME: hostname Swarm do nó onde importou a imagem.
   - NEXT_PUBLIC_SUPABASE_ANON_KEY: chave pública anon do projeto fkjjjpgxkjhqkhmdpmzk, mesma usada no build.
   - SUPABASE_SERVICE_ROLE_KEY: chave de servidor do mesmo projeto, fornecida apenas em runtime.
4. Atualize usando a imagem local, sem solicitar pull. A restrição de nó garante que o serviço execute onde a imagem foi importada. Para vários nós, use um registro acessível a todos.
5. Verifique o serviço saudável e /api/health. Teste login e permissões. Emissão/cancelamento fiscal devem ser testados apenas em homologação no ACBr.

Rede network_swarm_public, Traefik, resolver letsencryptresolver e domínio seguem os arquivos existentes. Ajuste se o ambiente diferir.
Variáveis NEXT_PUBLIC são incorporadas no build: mudar de projeto Supabase exige reconstruir a imagem.
Conceda bar aos operadores ativos. Cancelamento exige administrador ativo.
A chave service_role gravada no YAML antigo deve ser rotacionada no Supabase e substituída nas aplicações que a utilizam. Ela não foi copiada para esta entrega.
Não há migração SQL. Banco e ACBr não foram alterados.

Dependências: npm ci reportou 21 vulnerabilidades (3 críticas) no conjunto de dependências, incluindo aviso para Next.js 14.0.4. Esta entrega preserva as versões existentes; a atualização de segurança continua pendente.


Validação da imagem: build de produção concluído; /api/health e /login retornam 200. O middleware src/middleware.ts retorna 307 para login nas quatro operações do bar sem sessão, antes dos handlers. Testes unitários dos handlers: 281 passando. Teste do contêiner realizado sem rede externa. Login autenticado, banco real e ACBr real não foram exercitados.
