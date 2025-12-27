'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Bot, Plus, Trash2, Edit, Power, PowerOff, ArrowLeft,
  MessageSquare, Clock, Calendar, Zap
} from 'lucide-react'
import Link from 'next/link'

type RespostaAutomatica = {
  id: string
  nome: string
  gatilho_tipo: string
  palavras_chave: string[] | null
  resposta: string
  ativo: boolean
  horario_inicio: string | null
  horario_fim: string | null
  dias_semana: number[] | null
  delay_segundos: number
  prioridade: number
  uso_count: number
}

const GATILHOS = [
  { value: 'palavra_chave', label: 'Palavra-chave', icon: MessageSquare, desc: 'Responde quando detectar palavras específicas' },
  { value: 'primeira_mensagem', label: 'Primeira mensagem', icon: Zap, desc: 'Responde na primeira mensagem de um novo contato' },
  { value: 'fora_horario', label: 'Fora do horário', icon: Clock, desc: 'Responde fora do horário de atendimento' },
  { value: 'todas', label: 'Todas mensagens', icon: Bot, desc: 'Responde a todas as mensagens (cuidado!)' },
]

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

export default function RespostasAutomaticasPage() {
  const [respostas, setRespostas] = useState<RespostaAutomatica[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<RespostaAutomatica | null>(null)
  
  const [form, setForm] = useState({
    nome: '',
    gatilho_tipo: 'palavra_chave',
    palavras_chave: '',
    resposta: '',
    horario_inicio: '08:00',
    horario_fim: '18:00',
    dias_semana: [1, 2, 3, 4, 5] as number[],
    delay_segundos: 2,
    prioridade: 5
  })

  const supabase = createClientComponentClient()

  const carregarRespostas = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('respostas_automaticas')
      .select('*')
      .order('prioridade', { ascending: false })
    setRespostas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarRespostas()
  }, [])

  const salvar = async () => {
    if (!form.nome.trim() || !form.resposta.trim()) {
      toast.error('Nome e resposta são obrigatórios')
      return
    }

    if (form.gatilho_tipo === 'palavra_chave' && !form.palavras_chave.trim()) {
      toast.error('Informe pelo menos uma palavra-chave')
      return
    }

    const dados = {
      nome: form.nome,
      gatilho_tipo: form.gatilho_tipo,
      palavras_chave: form.gatilho_tipo === 'palavra_chave' 
        ? form.palavras_chave.split(',').map(p => p.trim().toLowerCase()).filter(p => p)
        : null,
      resposta: form.resposta,
      horario_inicio: form.gatilho_tipo === 'fora_horario' ? form.horario_inicio : null,
      horario_fim: form.gatilho_tipo === 'fora_horario' ? form.horario_fim : null,
      dias_semana: form.gatilho_tipo === 'fora_horario' ? form.dias_semana : null,
      delay_segundos: form.delay_segundos,
      prioridade: form.prioridade,
      updated_at: new Date().toISOString()
    }

    if (editando) {
      const { error } = await supabase
        .from('respostas_automaticas')
        .update(dados)
        .eq('id', editando.id)

      if (error) {
        toast.error('Erro ao atualizar: ' + error.message)
        return
      }
      toast.success('Resposta atualizada!')
    } else {
      const { error } = await supabase
        .from('respostas_automaticas')
        .insert({ ...dados, ativo: true })

      if (error) {
        toast.error('Erro ao criar: ' + error.message)
        return
      }
      toast.success('Resposta criada!')
    }

    resetForm()
    carregarRespostas()
  }

  const resetForm = () => {
    setForm({
      nome: '',
      gatilho_tipo: 'palavra_chave',
      palavras_chave: '',
      resposta: '',
      horario_inicio: '08:00',
      horario_fim: '18:00',
      dias_semana: [1, 2, 3, 4, 5],
      delay_segundos: 2,
      prioridade: 5
    })
    setEditando(null)
    setShowForm(false)
  }

  const editar = (r: RespostaAutomatica) => {
    setEditando(r)
    setForm({
      nome: r.nome,
      gatilho_tipo: r.gatilho_tipo,
      palavras_chave: r.palavras_chave?.join(', ') || '',
      resposta: r.resposta,
      horario_inicio: r.horario_inicio || '08:00',
      horario_fim: r.horario_fim || '18:00',
      dias_semana: r.dias_semana || [1, 2, 3, 4, 5],
      delay_segundos: r.delay_segundos || 2,
      prioridade: r.prioridade || 5
    })
    setShowForm(true)
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta resposta automática?')) return

    const { error } = await supabase
      .from('respostas_automaticas')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao excluir: ' + error.message)
      return
    }
    toast.success('Excluído!')
    carregarRespostas()
  }

  const toggleAtivo = async (r: RespostaAutomatica) => {
    const { error } = await supabase
      .from('respostas_automaticas')
      .update({ ativo: !r.ativo })
      .eq('id', r.id)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }
    toast.success(r.ativo ? 'Desativado' : 'Ativado')
    carregarRespostas()
  }

  const getGatilhoInfo = (tipo: string) => GATILHOS.find(g => g.value === tipo)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/crm">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6" />
              Respostas Automáticas
            </h1>
            <p className="text-muted-foreground">Configure bots para responder automaticamente</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Resposta
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editando ? 'Editar' : 'Nova'} Resposta Automática</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  placeholder="Ex: Saudação inicial"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prioridade (0-10)</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={form.prioridade}
                  onChange={e => setForm({ ...form, prioridade: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Maior = mais prioritário</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Gatilho *</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {GATILHOS.map(g => {
                  const Icon = g.icon
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setForm({ ...form, gatilho_tipo: g.value })}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        form.gatilho_tipo === g.value 
                          ? 'border-green-500 bg-green-50' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${form.gatilho_tipo === g.value ? 'text-green-600' : ''}`} />
                        <span className="font-medium">{g.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{g.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {form.gatilho_tipo === 'palavra_chave' && (
              <div>
                <label className="text-sm font-medium">Palavras-chave *</label>
                <Input
                  placeholder="oi, olá, bom dia, boa tarde (separadas por vírgula)"
                  value={form.palavras_chave}
                  onChange={e => setForm({ ...form, palavras_chave: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separe as palavras por vírgula. A resposta será ativada se qualquer uma for detectada.
                </p>
              </div>
            )}

            {form.gatilho_tipo === 'fora_horario' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Horário início atendimento</label>
                    <Input
                      type="time"
                      value={form.horario_inicio}
                      onChange={e => setForm({ ...form, horario_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Horário fim atendimento</label>
                    <Input
                      type="time"
                      value={form.horario_fim}
                      onChange={e => setForm({ ...form, horario_fim: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Dias de atendimento</label>
                  <div className="flex gap-2 mt-2">
                    {DIAS_SEMANA.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => {
                          const dias = form.dias_semana.includes(d.value)
                            ? form.dias_semana.filter(x => x !== d.value)
                            : [...form.dias_semana, d.value]
                          setForm({ ...form, dias_semana: dias })
                        }}
                        className={`px-3 py-1 rounded border text-sm ${
                          form.dias_semana.includes(d.value)
                            ? 'bg-green-500 text-white border-green-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    A resposta será enviada FORA destes horários/dias
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Delay (segundos)</label>
              <Input
                type="number"
                min={0}
                max={60}
                value={form.delay_segundos}
                onChange={e => setForm({ ...form, delay_segundos: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tempo de espera antes de enviar (simula digitação humana)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Resposta *</label>
              <textarea
                placeholder="Digite a mensagem automática..."
                value={form.resposta}
                onChange={e => setForm({ ...form, resposta: e.target.value })}
                className="w-full h-32 px-3 py-2 border rounded-md text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={salvar}>{editando ? 'Atualizar' : 'Criar'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <div className="grid gap-4">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Carregando...
          </Card>
        ) : respostas.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma resposta automática configurada</p>
          </Card>
        ) : (
          respostas.map(r => {
            const gatilho = getGatilhoInfo(r.gatilho_tipo)
            const Icon = gatilho?.icon || Bot
            return (
              <Card key={r.id} className={`${!r.ativo ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-green-600" />
                        <h3 className="font-semibold">{r.nome}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          r.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {r.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Prioridade: {r.prioridade}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        {gatilho?.label}
                        {r.gatilho_tipo === 'palavra_chave' && r.palavras_chave && (
                          <span className="ml-1">
                            ({r.palavras_chave.slice(0, 5).join(', ')}{r.palavras_chave.length > 5 ? '...' : ''})
                          </span>
                        )}
                        {r.gatilho_tipo === 'fora_horario' && (
                          <span className="ml-1">
                            (Atendimento: {r.horario_inicio} - {r.horario_fim})
                          </span>
                        )}
                      </p>
                      
                      <p className="text-sm mt-2 bg-gray-50 p-2 rounded line-clamp-2">
                        {r.resposta}
                      </p>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Usado {r.uso_count}x • Delay: {r.delay_segundos}s
                      </p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAtivo(r)}
                        title={r.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {r.ativo ? (
                          <Power className="h-4 w-4 text-green-600" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editar(r)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => excluir(r.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
