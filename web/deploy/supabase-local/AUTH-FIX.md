# Correção de Application error no bar e validação da portaria

Imagem: sistema-clube:local-auth-fix-20260907.

Causa reproduzida: o bar chamava useAuth sem AuthProvider no layout. Provider adicionado ao conteúdo do dashboard. Cliente e serviço de autenticação estabilizados. Consulta da sessão no evento SIGNED_IN adiada para fora do callback de autenticação, evitando aguardar o mesmo lock. Portaria agora trata falhas de carregamento de sessão e oferece nova tentativa.

Validação: TypeScript e build; navegador gstack autenticado com administrador local. Antes, o bar apresentou useAuth deve ser usado dentro de AuthProvider. Depois, mostrou produtos TESTE - Agua e TESTE - Suco, categorias e controles de pagamento. Navegação pelo menu do bar para portaria funcionou sem Application error nem exceções useAuth, TypeError ou ReferenceError observadas. Não foi realizada venda ou emissão fiscal.

Teste executado em container temporário na porta 3031. Somente nessa cópia, o endereço público da API dos arquivos de cliente foi ajustado para 3031 para manter mesma origem; a imagem distribuída continua na porta 3000. Firefox do usuário não controlado pelo teste. Avisos de WebSocket do proxy local permanecem e não são corrigidos por esta alteração.

No Portainer, atualize a imagem da stack sistema_clube, sem baixar do registro. Após atualizar, recarregue com Ctrl+F5; se houver sessão antiga travada, saia e entre novamente.
