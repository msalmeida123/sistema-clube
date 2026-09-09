# Holerite completo

## Uso

Em RH > Folha de Pagamento, abra Detalhes (ícone de olho). Preencha os dados da competência: código do funcionário, sede, admissão, conta de depósito, salário base, dependentes e bases INSS, IRRF e FGTS. As informações ficam salvas na folha daquele mês. Campos desconhecidos aparecem como Não informado.

Cada rubrica tem código, descrição, referência (dias, horas ou texto), classificação e valor. Inclua vencimentos ou descontos conforme necessário. Há sugestões de contribuição sindical, pensão alimentícia, plano de saúde, coparticipação médica, assistência odontológica, academia e vale-alimentação. Sugestões não lançam descontos automaticamente. Os códigos são definidos pelo RH.

Salvar demonstrativo atualiza as rubricas, os campos monetários existentes e os totais dentro de uma única transação. Somente administradores podem salvar, e somente em folhas rascunho/calculada. Versões antigas e folhas aprovadas/pagas/canceladas são rejeitadas. A operação não altera o status de pagamento.

Imprimir dados salvos imprime o demonstrativo individual. Imprimir holerites imprime os funcionários da competência/status selecionados, cada um em nova página. Imprimir resumo mantém o relatório consolidado.

## Cálculos

O editor soma os valores informados; não calcula bases tributárias nem alíquotas. O gerador de folhas preexistente ainda contém cálculo simplificado de INSS/IRRF com faixas identificadas no código como 2025. Essa rotina não foi atualizada neste ajuste. Os valores tributários precisam ser revisados antes da aprovação e uso efetivo da folha.

## Instalação

rh-holerite.sql já aplicado localmente. Para outra instalação, aplique a migração antes de atualizar a aplicação. Use web-redis.portainer.holerite.yml no Portainer sem baixar novamente as imagens. Imagem: sistema-clube:local-holerite-completo-20260908.

## Validação

TypeScript; testes de impressão com escape de texto; teste SQL com rollback de totais, versão concorrente, valores negativos, folha aprovada e usuário não administrador. Prévia holerite-exemplo.pdf com dados fictícios: uma página A4 conferida visualmente no navegador. A impressão pode ocupar mais páginas quando houver muitas rubricas.
