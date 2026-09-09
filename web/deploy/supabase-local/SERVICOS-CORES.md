# Cores do Kanban de Serviços

Em Serviços, o administrador pode clicar em **Configurar cores** e escolher as cores de A fazer, Iniciado, Finalizado e Urgente. A prévia acompanha a seleção. **Salvar cores** aplica a paleta a toda a equipe; **Cancelar** descarta alterações. **Restaurar padrão** preenche as cores originais, que precisam ser salvas para aplicar.

Urgente corresponde à prioridade alta. Um serviço urgente usa a cor de urgência até ser finalizado; depois usa a cor de Finalizado e mantém o selo Urgente. As datas, prioridades e status existentes são preservados. Outros usuários recebem a nova paleta em até 30 segundos ou ao recarregar a página.

## Instalação local

Aplique servicos-cores.sql no Supabase após servicos.sql. A migração foi aplicada nesta instalação local. Em outras instalações, execute a migração antes de atualizar a aplicação.

Atualize a stack existente no Portainer com web-redis.portainer.servicos-cores.yml. A imagem local é sistema-clube:local-servicos-cores-20260908. Desative a opção de baixar novamente as imagens.

Validação: TypeScript e teste SQL com rollback (admin salva, equipe lê, demais acessos negados e cores inválidas rejeitadas).
