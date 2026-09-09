# Busca por título

Imagem: sistema-clube:local-busca-titulos-20260907.

Atualize a imagem da stack sistema_clube no Portainer, sem baixar do registro.

Telas atualizadas: portaria principal; piscina; academia; sauna (identificação da pessoa); exames médicos (opção QR ou título); lista de dependentes; busca do titular ao cadastrar dependente. O repositório do módulo de dependentes também procura pelo título do titular.

Na portaria principal e sauna, digitar o título apresenta titular e dependentes para escolha. Na lista de dependentes, o título filtra os dependentes do titular. Piscina, academia e exames mantêm o atendimento a associados que já existia nesses módulos; não atribuem um exame ou assinatura do titular a um dependente.

Títulos têm correspondência exata, preservando zeros. QR cadastrado tem prioridade. Nomes com múltiplos resultados exigem escolha nas telas atualizadas. Leitores devem enviar Enter; também é possível clicar em Buscar. Não há disparo ao ler apenas um prefixo incompleto do QR.

QR de armário da sauna, PIX e WhatsApp identificam outros objetos e não são usados como títulos de associados.

Validação: TypeScript; cinco testes da busca compartilhada; conferência no banco de que o título de teste 990001 possui um dependente. Sem alteração de esquema ou de dados. Fluxos completos com scanner físico ainda precisam de teste após atualizar a stack.
