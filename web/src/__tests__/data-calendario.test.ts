import {formatarDataCalendario} from '../lib/data-calendario'

describe('Datas de calendário da academia', () => {
  test.each([
    ['2026-09-19', '19/09/2026'],
    ['2026-10-19', '19/10/2026'],
    ['2026-01-01', '01/01/2026'],
    ['2028-02-29', '29/02/2028'],
    ['', 'Não informado'],
  ])('%s preserva o dia cadastrado', (entrada, esperado) => {
    expect(formatarDataCalendario(entrada)).toBe(esperado)
  })
})
