import { permiteRota } from '@/lib/permissao-rota'
const regras = [
 {rota:'/dashboard',pode_visualizar:true,pode_criar:false,pode_editar:false},
 {rota:'/dashboard/associados',pode_visualizar:true,pode_criar:false,pode_editar:false},
 {rota:'/dashboard/bar',pode_visualizar:false,pode_criar:true,pode_editar:true}
]
test('dashboard não libera outros módulos nem prefixos semelhantes',()=>{
 expect(permiteRota(regras,'/dashboard/bar')).toBe(false)
 expect(permiteRota(regras,'/dashboard/associados-outro')).toBe(false)
 expect(permiteRota(regras,'/dashboard/desconhecido')).toBe(false)
})
test('visualizar não concede criação ou edição por URL',()=>{
 expect(permiteRota(regras,'/dashboard/associados')).toBe(true)
 expect(permiteRota(regras,'/dashboard/associados/123')).toBe(true)
 expect(permiteRota(regras,'/dashboard/associados/novo')).toBe(false)
 expect(permiteRota(regras,'/dashboard/associados/123/editar')).toBe(false)
})
test('permissao somente da piscina nao abre clube, academia ou sauna',()=>{
 const piscina=[{rota:'/dashboard/piscina-portaria',pode_visualizar:true,pode_criar:false,pode_editar:false}]
 expect(permiteRota(piscina,'/dashboard/piscina-portaria')).toBe(true)
 for(const rota of ['/dashboard/portaria','/dashboard/academia-portaria','/dashboard/portaria-sauna']) expect(permiteRota(piscina,rota)).toBe(false)
})
