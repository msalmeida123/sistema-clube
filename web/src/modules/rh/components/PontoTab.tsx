'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Clock, LogIn, LogOut, Coffee, AlertTriangle, CheckCircle } from 'lucide-react'
import { usePonto, useFuncionarios } from '../hooks/useRH'
import type { PontoDiario } from '../types'

const formatHoras = (h?: number) => h ? `${Math.floor(h)}h ${Math.round((h % 1) * 60)}min` : '-'

export function PontoTab() {
  const today = new Date().toISOString().split('T')[0]
  const [dataFiltro, setDataFiltro] = useState(today)
  const [funcionarioId, setFuncionarioId] = useState('')
  
  const { funcionarios } = useFuncionarios({ status: 'ativo' })
  const { pontos, loading, registrar, marcarFalta, abonarFalta, recarregar } = usePonto({
    data_inicio: dataFiltro,
    data_fim: dataFiltro,
    funcionario_id: funcionarioId || undefined,
  })

  // Registrar ponto rápido
  const [regFuncionario, setRegFuncionario] = useState('')
  const [regCampo, setRegCampo] = useState<'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida'>('entrada')

  const handleRegistrar = async () => {
    if (!regFuncionario) {
      toast.error('Selecione um funcionário')
      return
    }
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    try {
      await registrar(regFuncionario, today, regCampo, hora)
      toast.success(`Ponto registrado: ${regCampo.replace('_', ' ')} às ${hora}`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar ponto')
    }
  }

  const handleMarcarFalta = async (funcId: string) => {
    const justificativa = prompt('Justificativa (opcional):')
    try {
      await marcarFalta(funcId, dataFiltro, justificativa || undefined)
      toast.success('Falta registrada')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAbonar = async (pontoId: string) => {
    try {
      await abonarFalta(pontoId)
      toast.success('Falta abonada')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const CAMPO_LABELS = {
    entrada: 'Entrada',
    saida_almoco: 'Saída Almoço',
    retorno_almoco: 'Retorno Almoço',
    saida: 'Saída',
  }

  return (
    <div className="space-y-6">
      {/* Registro rápido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Registrar Ponto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="border rounded-md px-3 py-2 text-sm flex-1"
              value={regFuncionario}
              onChange={(e) => setRegFuncionario(e.target.value)}
            >
              <option value="">Selecione o funcionário</option>
              {funcionarios.map(f => (
                <option key={f.id} value={f.id}>{f.nome} - {f.cargo}</option>
              ))}
            </select>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={regCampo}
              onChange={(e) => setRegCampo(e.target.value as any)}
            >
              {Object.entries(CAMPO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Button onClick={handleRegistrar}>
              <LogIn className="h-4 w-4 mr-2" /> Registrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Data</label>
          <Input type="date" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} className="w-44" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">Funcionário</label>
          <select
            className="border rounded-md px-3 py-2 text-sm w-full"
            value={funcionarioId}
            onChange={(e) => setFuncionarioId(e.target.value)}
          >
            <option value="">Todos</option>
            {funcionarios.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de pontos */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : pontos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum registro de ponto para esta data</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Funcionário</th>
                <th className="text-center p-3">Entrada</th>
                <th className="text-center p-3 hidden sm:table-cell">Saída Almoço</th>
                <th className="text-center p-3 hidden sm:table-cell">Retorno</th>
                <th className="text-center p-3">Saída</th>
                <th className="text-center p-3">Horas</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pontos.map(ponto => (
                <tr key={ponto.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-medium">{ponto.funcionario?.nome || '-'}</p>
                    <p className="text-xs text-gray-500">{ponto.funcionario?.cargo}</p>
                  </td>
                  <td className="p-3 text-center font-mono">{ponto.entrada || '-'}</td>
                  <td className="p-3 text-center font-mono hidden sm:table-cell">{ponto.saida_almoco || '-'}</td>
                  <td className="p-3 text-center font-mono hidden sm:table-cell">{ponto.retorno_almoco || '-'}</td>
                  <td className="p-3 text-center font-mono">{ponto.saida || '-'}</td>
                  <td className="p-3 text-center">{formatHoras(ponto.horas_trabalhadas)}</td>
                  <td className="p-3 text-center">
                    {ponto.falta ? (
                      <Badge className={ponto.abonado ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}>
                        {ponto.abonado ? 'Falta Abonada' : 'Falta'}
                      </Badge>
                    ) : ponto.horas_trabalhadas ? (
                      <Badge className="bg-green-100 text-green-800">OK</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Parcial</Badge>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {ponto.falta && !ponto.abonado && (
                      <Button variant="ghost" size="sm" onClick={() => handleAbonar(ponto.id)} title="Abonar falta">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
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
