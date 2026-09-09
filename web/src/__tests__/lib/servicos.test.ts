import {periodoServicos,dataServico} from '@/lib/servicos'
test('Semana vai de segunda a domingo, inclusive ao selecionar domingo',()=>{
 expect(periodoServicos('2026-09-13','semana')).toEqual({inicio:'2026-09-07',fim:'2026-09-13'})
})
test('Semana atravessa o ano corretamente',()=>{
 expect(periodoServicos('2026-01-01','semana')).toEqual({inicio:'2025-12-29',fim:'2026-01-04'})
})
test('Mês respeita fevereiro bissexto e não bissexto',()=>{
 expect(periodoServicos('2028-02-15','mes').fim).toBe('2028-02-29')
 expect(periodoServicos('2026-02-15','mes').fim).toBe('2026-02-28')
})
test('Dia e apresentação não mudam por fuso',()=>{
 expect(periodoServicos('2026-09-08','dia')).toEqual({inicio:'2026-09-08',fim:'2026-09-08'})
 expect(dataServico('2026-09-08')).toBe('08/09/2026')
})
test.each(['2026-02-30','', '08/09/2026'])('Rejeita data inválida %s',data=>{
 expect(()=>periodoServicos(data,'dia')).toThrow()
})
