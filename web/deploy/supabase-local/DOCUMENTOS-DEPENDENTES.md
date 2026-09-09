# Documentos de dependentes

Migração local: documentos-dependentes.sql (aplicada em 07/09/2026).
Imagem: sistema-clube:local-documentos-20260907.

No Portainer, edite a stack sistema_clube, altere somente a imagem do serviço e atualize sem baixar novamente a imagem do registro.

Cadastro e edição aceitam certidão de nascimento, casamento, matrícula e documento complementar. Armazenamento privado, PDF/JPG/PNG até 10 MB, acesso restrito ao administrador local ativo. Visualização por URL temporária de 60 segundos.

Filhos e equivalentes: até 21 anos inclusive; a partir de 22 exigem faculdade e matrícula válida, sem limite máximo. A categoria universitário exige matrícula em qualquer idade. A validade é informada pela administração conforme o documento; não há prazo anual presumido.

Registros existentes permanecem preservados. A tela de detalhes mostra as pendências atuais. Ao salvar um cadastro ativo, o banco exige documentação completa e caminhos existentes no armazenamento. O vencimento é conferido na consulta da tela e ao salvar; esta alteração não implementa bloqueio automático de catraca/portaria nem altera automaticamente o campo status.

Arquivos enviados antes de cancelar um cadastro podem ficar sem vínculo no armazenamento; permanecem privados. Não há exclusão automática de documentos.

Verificações: TypeScript, seis testes unitários de idade/matrícula e transação revertida no PostgreSQL comprovando rejeição de documentos ausentes e caminhos inexistentes. Upload/visualização reais no navegador ainda precisam de teste após atualizar a stack.
