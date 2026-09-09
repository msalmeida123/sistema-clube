'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { abrirDocumento } from '@/lib/impressao-documento'
import { conteudoFolha } from '../folha-impressao'
import { HoleriteEditor } from './HoleriteEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { DollarSign, FileText, CheckCircle, CreditCard, Plus, Eye, Printer } from 'lucide-react'
import { useFolhaPagamento, useFuncionarios } from '../hooks/useRH'
import type { FolhaPagamento, StatusFolha } from '../types'

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const STATUS_FOLHA_COLORS: Record<StatusFolha, string> = {
  rascunho: 'bg-gray-100 text-gray-800',
  calculada: 'bg-blue-100 text-blue-800',
  aprovada: 'bg-green-100 text-green-800',
  paga: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-800',
}

const STATUS_FOLHA_LABELS: Record<StatusFolha, string> = {
  rascunho: 'Rascunho',
  calculada: 'Calculada',
  aprovada: 'Aprovada',
  paga: 'Paga',
  cancelada: 'Cancelada',
}

export function FolhaTab() {
  const [imprimindo,setImprimindo]=useState(false)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [referencia, setReferencia] = useState(currentMonth)
  const [statusFilter, setStatusFilter] = useState<StatusFolha | ''>('')
  const [selectedFolha, setSelectedFolha] = useState<FolhaPagamento | null>(null)
  
  const { folhas, loading, gerarFolhaMensal, aprovar, marcarComoPaga, recarregar } = useFolhaPagamento({
    referencia,
    status: statusFilter || undefined,
  })

  const handleGerar = async () => {
    if (!confirm(`Gerar folha de pagamento para ${referencia}?`)) return
    try {
      const result = await gerarFolhaMensal(referencia)
      toast.success(`${result.length} folha(s) gerada(s)!`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar folha')
    }
  }

  const handleAprovar = async (id: string) => {
    try {
      await aprovar(id)
      toast.success('Folha aprovada!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handlePagar = async (id: string) => {
    if (!confirm('Confirma o pagamento?')) return
    try {
      await marcarComoPaga(id)
      toast.success('Pagamento registrado!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function imprimir(id?:string,holerites=false){
    const janela=window.open('', '_blank')
    if(!janela){toast.error('Permita novas janelas para imprimir.');return}
    janela.document.body.textContent='Preparando impressão...'
    setImprimindo(true)
    try{
      const r=await fetch('/api/rh/configuracao');const empresa=await r.json();if(!r.ok)throw Error(empresa.error)
      const db=createClient();const registros:FolhaPagamento[]=[]
      for(let offset=0;;offset+=500){
        let q=db.from('folha_pagamento').select('*, funcionario:funcionarios(nome,cargo,departamento,data_admissao,banco,agencia,conta)').order('id').range(offset,offset+499)
        if(id)q=q.eq('id',id);else {q=q.eq('referencia',referencia);if(statusFilter)q=q.eq('status',statusFilter)}
        const {data,error}=await q;if(error)throw error;registros.push(...(data||[]));if((data||[]).length<500)break
      }
      if(!registros.length)throw Error('Nenhuma folha encontrada para imprimir.')
      const conteudo=holerites?registros.map(f=>'<div class="pagina-holerite">'+conteudoFolha([f],empresa,f.referencia,true)+'</div>').join(''):conteudoFolha(registros,empresa,id?registros[0].referencia:referencia,!!id,statusFilter?STATUS_FOLHA_LABELS[statusFilter]:'Todos')
      abrirDocumento('Folha de pagamento','<style>@media print{.pagina-holerite + .pagina-holerite{break-before:page}}</style>'+conteudo,janela)
    }catch(e:any){janela.close();toast.error(e.message||'Não foi possível preparar a impressão.')}
    finally{setImprimindo(false)}
  }

  // Totais
  const totalProventos = folhas.reduce((acc, f) => acc + f.total_proventos, 0)
  const totalDescontos = folhas.reduce((acc, f) => acc + f.total_descontos, 0)
  const totalLiquido = folhas.reduce((acc, f) => acc + f.salario_liquido, 0)

  if(selectedFolha){const f=selectedFolha;return <div className="space-y-4">
    <div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-semibold">Demonstrativo · {f.funcionario?.nome} · {f.referencia}</h3><div className="flex gap-2"><Button variant="outline" disabled={imprimindo} onClick={()=>void imprimir(f.id)}><Printer className="h-4 w-4 mr-2"/>Imprimir dados salvos</Button><Button variant="outline" onClick={()=>setSelectedFolha(null)}>Voltar</Button></div></div>
    <HoleriteEditor key={f.id} folha={f} onSave={()=>{setSelectedFolha(null);void recarregar()}}/>
  </div>}

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total Proventos</p><p className="text-xl font-bold text-green-600">{formatCurrency(totalProventos)}</p></div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total Descontos</p><p className="text-xl font-bold text-red-600">{formatCurrency(totalDescontos)}</p></div>
            <DollarSign className="h-8 w-8 text-red-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total Líquido</p><p className="text-xl font-bold text-blue-600">{formatCurrency(totalLiquido)}</p></div>
            <DollarSign className="h-8 w-8 text-blue-200" />
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Referência</label>
          <Input type="month" value={referencia} onChange={(e) => setReferencia(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <select className="border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFolha | '')}>
            <option value="">Todos</option>
            {Object.entries(STATUS_FOLHA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="sm:ml-auto sm:self-end flex gap-2">
          <Button variant="outline" disabled={loading||imprimindo||!folhas.length} onClick={()=>void imprimir()}><Printer className="h-4 w-4 mr-2"/>Imprimir resumo</Button>
          <Button variant="outline" disabled={loading||imprimindo||!folhas.length} onClick={()=>void imprimir(undefined,true)}>Imprimir holerites</Button>
          <Button onClick={handleGerar}>
            <Plus className="h-4 w-4 mr-2" /> Gerar Folha do Mês
          </Button>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : folhas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhuma folha para este período</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Funcionário</th>
                <th className="text-right p-3 hidden md:table-cell">Proventos</th>
                <th className="text-right p-3 hidden md:table-cell">Descontos</th>
                <th className="text-right p-3">Líquido</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {folhas.map(folha => (
                <tr key={folha.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-medium">{folha.funcionario?.nome || '-'}</p>
                    <p className="text-xs text-gray-500">{folha.funcionario?.cargo} - {folha.funcionario?.departamento}</p>
                  </td>
                  <td className="p-3 text-right hidden md:table-cell text-green-600">{formatCurrency(folha.total_proventos)}</td>
                  <td className="p-3 text-right hidden md:table-cell text-red-600">{formatCurrency(folha.total_descontos)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(folha.salario_liquido)}</td>
                  <td className="p-3 text-center">
                    <Badge className={STATUS_FOLHA_COLORS[folha.status]}>{STATUS_FOLHA_LABELS[folha.status]}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" disabled={imprimindo} onClick={()=>void imprimir(folha.id)} aria-label={"Imprimir demonstrativo de "+folha.funcionario?.nome}><Printer className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedFolha(folha)} title="Detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {folha.status === 'rascunho' && (
                        <Button variant="ghost" size="sm" onClick={() => handleAprovar(folha.id)} title="Aprovar">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {folha.status === 'aprovada' && (
                        <Button variant="ghost" size="sm" onClick={() => handlePagar(folha.id)} title="Pagar">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
