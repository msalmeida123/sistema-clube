import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {KPICards} from '@/components/dashboard/KPICards'
test('Renderiza somente o cartão CRM selecionado',()=>{
 const html=renderToStaticMarkup(<KPICards kpis={null} loading={false} paineis={['conversas']}/> )
 expect(html).toContain('Conversas Abertas')
 expect(html).not.toContain('Associados Ativos')
 expect(html).not.toContain('Inadimplência')
 expect(html).not.toContain('Armários em Uso')
})
test('Não mostra cartões de carregamento para painel vazio',()=>{
 expect(renderToStaticMarkup(<KPICards kpis={null} loading paineis={[]}/>)).toBe('')
})
