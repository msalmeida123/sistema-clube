# Implantação Debian Swarm

Código sincronizado com a instalação de 14/09/2026. Imagem atualmente usada: `sistema-clube:next15-09126aa2b937`.

O YAML de exemplo exige variáveis de ambiente fornecidas privadamente antes de `docker stack deploy`. Não substitua o YAML privado em produção pelo exemplo sem preencher essas variáveis. A imagem é local ao nó debianserver; publicar este código no GitHub não publica a imagem em um registro.

As redes externas e Docker configs nomeadas no YAML precisam existir. Os dois arquivos nginx acompanham o modelo. Construa a imagem usando o Dockerfile de web, passando apenas as configurações públicas de build. Segredos de serviço e SMTP são fornecidos apenas em execução.

A migração separar-portarias.sql e seus testes testar-portarias.sql já foram aplicados nesta instalação. Em outra instalação, faça backup e execute ambos na mesma transação PostgreSQL com ON_ERROR_STOP; os testes revertem os dados sintéticos por savepoint.

Não versionar runtime.env, build-public.env, dumps, logs ou o YAML privado.
