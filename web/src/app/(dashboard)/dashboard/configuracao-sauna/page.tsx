'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Droplets, Plus, Trash2, Settings, Loader2, Key, 
  AlertTriangle, CheckCircle, Wrench, RefreshCw
} from 'lucide-react'

type Armario = {
  id: string
  numero: number
  status: string
  qr_code: string
  created_at: string
}

export default function ConfiguracaoSaunaPage() {
  const [armarios, setArmarios] = useState<Armario[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  // Adicionar armários
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('5')
  const [numeroInicial, setNumeroInicial] = useState('')
  
  // Edição
  const [modalExcluir, setModalExcluir] = useState(false)
  const [armarioExcluir, setArmarioExcluir] = useState<Armario | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    carregarArmarios()
  }, [])

  const carregarArmarios = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('armarios_sauna')
      .select('*')
      .order('numero')

    if (error) {
      toast.error('Erro ao carregar armários')
    } else {
      setArmarios(data || [])
      if (data && data.length > 0) {
        const maiorNumero = Math.max(...data.map(a => a.numero))
        setNumeroInicial(String(maiorNumero + 1))
      } else {
        setNumeroInicial('1')
      }
    }
    setLoading(false)
  }

  const adicionarArmarios = async () => {
    const quantidade = parseInt(quantidadeAdicionar)
    const inicio = parseInt(numeroInicial)

    if (isNaN(quantidade) || quantidade < 1 || quantidade > 100) {
      toast.error('Quantidade deve ser entre 1 e 100')
      return
    }

    if (isNaN(inicio) || inicio < 1) {
      toast.error('Número inicial inválido')
      return
    }

    const numerosExistentes = armarios.map(a => a.numero)
    const novosNumeros = Array.from({ length: quantidade }, (_, i) => inicio + i)
    const conflitos = novosNumeros.filter(n => numerosExistentes.includes(n))

    if (conflitos.length > 0) {
      toast.error(`Armários já existem: ${conflitos.join(', ')}`)
      return
    }

    setSalvando(true)

    const novosArmarios = novosNumeros.map(numero => ({
      numero,
      status: 'disponivel',
      qr_code: `SAUNA-ARM-${numero}`,
    }))

    const { error } = await supabase
      .from('armarios_sauna')
      .insert(novosArmarios)

    if (error) {
      toast.error('Erro ao adicionar armários: ' + error.message)
    } else {
      toast.success(`${quantidade} armário(s) adicionado(s) com sucesso!`)
      carregarArmarios()
    }

    setSalvando(false)
  }

  const alterarStatus = async (armario: Armario, novoStatus: string) => {
    if (armario.status === 'ocupado') {
      toast.error('Não é possível alterar status de armário em uso')
      return
    }

    const { error } = await supabase
      .from('armarios_sauna')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', armario.id)

    if (error) {
      toast.error('Erro ao alterar status')
    } else {
      toast.success(`Armário ${armario.numero} alterado para ${novoStatus}`)
      carregarArmarios()
    }
  }

  const confirmarExclusao = (armario: Armario) => {
    if (armario.status === 'ocupado') {
      toast.error('Não é possível excluir armário em uso')
      return
    }
    setArmarioExcluir(armario)
    setModalExcluir(true)
  }

  const excluirArmario = async () => {
    if (!armarioExcluir) return

    setSalvando(true)

    const { error } = await supabase
      .from('armarios_sauna')
      .delete()
      .eq('id', armarioExcluir.id)

    if (error) {
      toast.error('Erro ao excluir: ' + error.message)
    } else {
      toast.success(`Armário ${armarioExcluir.numero} excluído`)
      carregarArmarios()
    }

    setModalExcluir(false)
    setArmarioExcluir(null)
    setSalvando(false)
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'disponivel':
        return { cor: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, label: 'Disponível' }
      case 'ocupado':
        return { cor: 'bg-red-100 text-red-700 border-red-300', icon: Key, label: 'Ocupado' }
      case 'manutencao':
        return { cor: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Wrench, label: 'Manutenção' }
      default:
        return { cor: 'bg-gray-100 text-gray-700 border-gray-300', icon: AlertTriangle, label: status }
    }
  }

  const stats = {
    total: armarios.length,
    disponiveis: armarios.filter(a => a.status === 'disponivel').length,
    ocupados: armarios.filter(a => a.status === 'ocupado').length,
    manutencao: armarios.filter(a => a.status === 'manutencao').length,
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            Configuração da Sauna
          </h1>
          <p className="text-muted-foreground">Gerenciar armários e configurações</p>
        </div>
        <Button variant="outline" onClick={carregarArmarios}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.disponiveis}</div>
              <div className="text-sm text-muted-foreground">Disponíveis</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.ocupados}</div>
              <div className="text-sm text-muted-foreground">Ocupados</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.manutencao}</div>
              <div className="text-sm text-muted-foreground">Manutenção</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adicionar Armários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Armários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Número Inicial</label>
              <Input
                type="number"
                value={numeroInicial}
                onChange={e => setNumeroInicial(e.target.value)}
                placeholder="Ex: 51"
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Quantidade</label>
              <Input
                type="number"
                value={quantidadeAdicionar}
                onChange={e => setQuantidadeAdicionar(e.target.value)}
                placeholder="Ex: 10"
                min="1"
                max="100"
                className="mt-1"
              />
            </div>
            <Button 
              onClick={adicionarArmarios} 
              disabled={salvando}
              className="bg-green-600 hover:bg-green-700"
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Serão criados armários do número {numeroInicial || '?'} ao {
              numeroInicial && quantidadeAdicionar 
                ? parseInt(numeroInicial) + parseInt(quantidadeAdicionar) - 1 
                : '?'
            }
          </p>
        </CardContent>
      </Card>

      {/* Lista de Armários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Armários ({armarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Número</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">QR Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {armarios.map(armario => {
                  const statusInfo = getStatusInfo(armario.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <tr key={armario.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-lg">{armario.numero}</span>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {armario.qr_code}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.cor}`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {armario.status !== 'ocupado' && (
                            <>
                              {armario.status !== 'disponivel' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => alterarStatus(armario, 'disponivel')}
                                  className="text-green-600 hover:text-green-700"
                                  title="Marcar como disponível"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {armario.status !== 'manutencao' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => alterarStatus(armario, 'manutencao')}
                                  className="text-yellow-600 hover:text-yellow-700"
                                  title="Colocar em manutenção"
                                >
                                  <Wrench className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => confirmarExclusao(armario)}
                                className="text-red-600 hover:text-red-700"
                                title="Excluir armário"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {armario.status === 'ocupado' && (
                            <span className="text-sm text-gray-400">Em uso</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {armarios.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum armário cadastrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Confirmar Exclusão */}
      {modalExcluir && armarioExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </h2>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o <strong>Armário {armarioExcluir.numero}</strong>?
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setModalExcluir(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={excluirArmario}
                disabled={salvando}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {salvando ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
