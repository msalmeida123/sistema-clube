# Impressão de contrato e convite

- **Associados > abrir cadastro > Gerar Contrato > Imprimir**: abre uma janela própria, sem o menu do sistema. Clique em **Imprimir / Salvar em PDF** e escolha papel A4 e a impressora de documentos (inclusive uma impressora de rede instalada no computador). O texto flui em várias páginas, mantendo espaços de assinatura. **Salvar em PDF** abre a mesma visualização para escolher esse destino no navegador.
- **Convites > Imprimir convite**: abre nome, CPF, associado responsável, título, data da visita, QR Code e código legível. O QR contém exatamente o valor salvo no convite. Convites vencidos, utilizados, cancelados ou sem QR são recusados.

Não utiliza a impressora térmica da cozinha. Abrir a impressão não altera o status do convite. A portaria confere a data e registra o uso somente se ele ainda estiver liberado, evitando duas utilizações simultâneas.

Compatibilidade local corrigida: convites usam nome_convidado/cpf_convidado/data_visita/data_utilizacao. Configuração ausente criada por `convites-config.sql`, com os valores iniciais que a tela já previa: R$ 30, limite 2 por mês e intervalo 90 dias. Administrador pode ajustar em Convites > Configurações.

O contrato mantém o modelo existente, com a regra de faculdade sem limite fixo de idade já solicitada pelo usuário. Não foi feita revisão jurídica do modelo. Mensalidade vem do cadastro do associado e, na ausência, do plano por código; dados ausentes são exibidos como não informados.

Validação concluída com gstack: conteúdo real das janelas geradas pelos botões exportado em PDF. Contrato de teste com quatro páginas não vazias, contendo assinaturas do associado e das duas testemunhas. Convite de teste com uma página e uma imagem QR, nome, data e código. O convite temporário foi removido. Oito testes automatizados e compilação passaram. Não houve impressão física.
