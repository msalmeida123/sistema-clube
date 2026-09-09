# Impressora da cozinha no sistema local

Abra **Impressora da Cozinha** no menu, usando uma conta administradora. Informe o IP privado da impressora, porta RAW TCP (normalmente 9100), papel 58 ou 80 mm e modo compatível com o modelo. Salve, ative e use **Imprimir teste**. A configuração fica no Supabase local, sem editar variáveis no Portainer.

Suporta envio RAW TCP de texto ASCII (sem acentos), com inicialização/corte ESC/POS opcionais. Impressoras que exigem driver Windows, IPP ou outro protocolo precisam de integração específica. O computador Docker deve alcançar a impressora; não é necessário publicar porta de entrada adicional no container. Use endereço estável na rede da instalação.

A migração `bar-impressora.sql` já foi aplicada ao banco local; execute também em qualquer instalação nova. As tabelas de configuração e tentativas não são acessíveis diretamente por usuários comuns: as rotas verificam sessão, permissão bar e, para configuração/teste, administrador.

Na venda finalizada, **Enviar à cozinha** transmite somente os itens marcados para preparo. O histórico permite **Reimprimir na cozinha**, com confirmação e indicação REIMPRESSÃO no papel. A visualização HTML continua disponível como alternativa. Não há envio automático ao finalizar a venda.

O registro único por pedido impede repetição do primeiro envio. Em falha de rede o resultado fica incerto: verifique o papel antes de solicitar outra via. Não há repetição automática, fila offline ou confirmação de papel/suprimentos. A resposta positiva significa conclusão do envio pelo socket, não comprovação física da impressão (ver documentação [Node.js net](https://nodejs.org/api/net.html#socketenddata-encoding-callback)).

Validação: testes de permissões, destinos privados, filtragem de alimentos, remoção de controles injetados, prevenção de duplicação, falha de envio e receptor TCP simulado. Nenhuma impressora física recebeu dados durante o desenvolvimento.
