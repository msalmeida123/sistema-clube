import {calcularCarneConjunto} from '@/lib/carne-conjunto'
test('soma mensalidade integral à parcela do título',()=>{
 const r=calcularCarneConjunto(1200,100,12)
 expect(r.total).toBe(2400)
 expect(r.parcelas).toHaveLength(12)
 expect(r.parcelas.every(p=>p.titulo===100&&p.mensalidade===100&&p.total===200)).toBe(true)
})
test('distribui centavos sem perder nem criar dinheiro',()=>{
 const r=calcularCarneConjunto(100,25,3)
 expect(r.parcelas.map(p=>p.titulo)).toEqual([33.34,33.33,33.33])
 expect(r.parcelas.reduce((a,p)=>a+Math.round(p.total*100),0)).toBe(17500)
})
test('título é cobrado uma vez e mensalidade uma vez por mês',()=>{
 expect(calcularCarneConjunto(1200,100,6).total).toBe(1800)
 expect(calcularCarneConjunto(1200,100,12).total).toBe(2400)
})
test.each([0,61,1.5,NaN])('rejeita quantidade inválida %s',n=>expect(()=>calcularCarneConjunto(100,10,n)).toThrow())
test('permite título zero sem dividir a mensalidade',()=>expect(calcularCarneConjunto(0,100,12).parcelas[0].total).toBe(100))
test.each([-1,NaN,Infinity])('rejeita valores inválidos %s',v=>expect(()=>calcularCarneConjunto(v,10,12)).toThrow())
