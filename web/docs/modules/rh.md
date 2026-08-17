# Módulo: RH (Recursos Humanos)

Gestão de funcionários do clube: cadastro, ponto, folha de pagamento e afastamentos/férias.

## Localização
`src/modules/rh/`

## Status
✅ Completo (possui `sql/create_tables.sql` próprio)

## Entidades principais
### Funcionários
`Funcionario` — dados pessoais e de endereço (iguais ao padrão de `Associado`), dados profissionais (cargo, departamento, `tipo_contrato`: `clt | pj | estagiario | temporario | freelancer`, salário, `turno`, carga horária, `status`: `ativo | inativo | ferias | afastado | desligado`), dados bancários (inclusive PIX) e documentos trabalhistas (CTPS, PIS).

### Controle de Ponto
- `RegistroPonto` — batida individual (`entrada | saida_almoco | retorno_almoco | saida`)
- `PontoDiario` — consolidado do dia: horas trabalhadas, horas extras, atraso, falta, abono
- `ResumoPonto` — agregado por funcionário

### Folha de Pagamento
`FolhaPagamento` — referência (YYYY-MM), proventos (salário base, horas extras, adicionais noturno/insalubridade/periculosidade, gratificação, comissão), descontos (INSS, IRRF, vale-transporte, vale-refeição, faltas, atrasos, adiantamento), salário líquido, `status` (`rascunho | calculada | aprovada | paga | cancelada`).

### Férias e Afastamentos
`Afastamento` — `tipo` (férias, licença médica/maternidade/paternidade, afastamento INSS, falta justificada/injustificada, folga, outro), período, dias totais, `status` (`solicitado | aprovado | em_andamento | concluido | rejeitado | cancelado`), aprovação.

### Estatísticas e constantes
`RHStats` (total, ativos, inativos, em_ferias, afastados, total_folha_mes, por departamento), `DEPARTAMENTOS` (lista fixa: Administração, Financeiro, Portaria, Manutenção, Limpeza, Cozinha/Bar, Esportes, Piscina, Academia, Segurança, Eventos, Outro).

## Hooks
- `useFuncionarios`, `useFuncionario`, `useFuncionarioMutations`
- `usePonto`
- `useFolhaPagamento`
- `useAfastamentos`
- `useRHStats`

## Components
- `RHDashboard`, `FuncionariosTab`, `FuncionarioForm`, `PontoTab`, `FolhaTab`, `AfastamentosTab`

## Repository / Service
- `RHRepository` / `createRHRepository`
- `RHService` / `createRHService`

## Uso
```tsx
import { useRH, FuncionarioForm } from '@/modules/rh'
```

## Relacionados
- Independente dos demais módulos (funcionários ≠ associados), mas compartilha o padrão de endereço/dados pessoais usado em `associados`.
