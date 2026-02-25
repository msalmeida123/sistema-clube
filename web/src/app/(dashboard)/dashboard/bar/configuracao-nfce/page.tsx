'use client'

import { useEffect, useState } from 'react'
import { Settings, Save, Wifi, WifiOff, CheckCircle2, AlertCircle, Building2, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConfigNFCe, useSalvarConfigNFCe } from '@/modules/bar/hooks/useBar'
import type { AmbienteNFCe, BarConfigNFCeFormData } from '@/modules/bar/types'

const UF_OPTIONS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
]

const CRT_OPTIONS = [
  { value: 1, label: '1 - Simples Nacional' },
  { value: 2, label: '2 - Simples Nacional (excesso)' },
  { value: 3, label: '3 - Regime Normal' },
  { value: 4, label: '4 - Simples Nacional MEI' }
]

export default function ConfiguracaoNFCePage() {
  const { data: config, isLoading } = useConfigNFCe()
  const salvarConfig = useSalvarConfigNFCe()

  const [form, setForm] = useState<BarConfigNFCeFormData>({
    acbr_url: 'localhost:3434',
    ambiente: 2 as AmbienteNFCe,
    cnpj_emitente: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    crt: 1,
    uf: 'SP',
    csc_id: '',
    csc_token: '',
    serie_nfce: '1',
    ativo: false,
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_municipio: '',
    codigo_municipio: '',
    endereco_cep: '',
    telefone: '',
    resp_tec_cnpj: '',
    resp_tec_contato: '',
    resp_tec_email: '',
    resp_tec_fone: ''
  })

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    if (config) {
      setForm({
        acbr_url: config.acbr_url || 'localhost:3434',
        ambiente: config.ambiente || 2,
        cnpj_emitente: config.cnpj_emitente || '',
        razao_social: config.razao_social || '',
        nome_fantasia: config.nome_fantasia || '',
        inscricao_estadual: config.inscricao_estadual || '',
        crt: config.crt ?? 1,
        uf: config.uf || 'SP',
        csc_id: config.csc_id || '',
        csc_token: config.csc_token || '',
        serie_nfce: config.serie_nfce || '1',
        ativo: config.ativo ?? false,
        endereco_logradouro: config.endereco_logradouro || '',
        endereco_numero: config.endereco_numero || '',
        endereco_complemento: config.endereco_complemento || '',
        endereco_bairro: config.endereco_bairro || '',
        endereco_municipio: config.endereco_municipio || '',
        codigo_municipio: config.codigo_municipio || '',
        endereco_cep: config.endereco_cep || '',
        telefone: config.telefone || '',
        resp_tec_cnpj: config.resp_tec_cnpj || '',
        resp_tec_contato: config.resp_tec_contato || '',
        resp_tec_email: config.resp_tec_email || '',
        resp_tec_fone: config.resp_tec_fone || ''
      })
    }
  }, [config])

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSalvar = () => {
    salvarConfig.mutate(form)
  }

  const handleTestarConexao = async () => {
    if (!form.acbr_url) return
    setTestStatus('testing')
    setTestMsg('')
    try {
      const res = await fetch(`/api/bar/nfce/emitir?acao=status`)
      const data = await res.json()
      if (data.status === 'conectado') {
        setTestStatus('ok')
        setTestMsg('ACBrMonitor respondeu com sucesso via TCP')
      } else {
        setTestStatus('error')
        setTestMsg(data.mensagem || 'Não foi possível conectar')
      }
    } catch {
      setTestStatus('error')
      setTestMsg('Erro ao testar conexão')
    }
    setTimeout(() => setTestStatus('idle'), 6000)
  }

  if (isLoading) {
    return <div className="p-6 text-gray-400">Carregando configurações...</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="text-amber-500" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-white">Configuração NFC-e</h1>
          <p className="text-sm text-gray-400">Integração com ACBrMonitor via TCP Socket</p>
        </div>
      </div>

      {/* Ativar/Desativar */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-medium">Emissão de NFC-e</h2>
            <p className="text-sm text-gray-400 mt-1">Habilite para emitir notas fiscais pelo PDV via ACBrMonitor</p>
          </div>
          <button
            onClick={() => update('ativo', !form.ativo)}
            className={`w-14 h-7 rounded-full transition-colors relative ${form.ativo ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${form.ativo ? 'left-8' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Conexão ACBr */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-white font-medium flex items-center gap-2">
          <Wifi size={18} className="text-blue-400" />
          Conexão ACBrMonitor (TCP/IP)
        </h2>
        <p className="text-xs text-gray-500">O ACBrMonitor deve estar configurado para comunicação TCP/IP. Informe host:porta (padrão: localhost:3434)</p>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Host:Porta do ACBrMonitor</label>
          <div className="flex gap-2">
            <Input
              placeholder="localhost:3434 ou 192.168.1.100:3434"
              value={form.acbr_url}
              onChange={e => update('acbr_url', e.target.value)}
              className="bg-gray-900 border-gray-600 flex-1"
            />
            <Button
              variant="outline"
              onClick={handleTestarConexao}
              disabled={testStatus === 'testing' || !form.acbr_url}
              className="gap-2 min-w-[130px]"
            >
              {testStatus === 'testing' ? (
                <><span className="animate-spin">⟳</span> Testando...</>
              ) : testStatus === 'ok' ? (
                <><CheckCircle2 size={16} className="text-green-400" /> Conectado</>
              ) : testStatus === 'error' ? (
                <><WifiOff size={16} className="text-red-400" /> Falhou</>
              ) : (
                'Testar Conexão'
              )}
            </Button>
          </div>
          {testMsg && (
            <p className={`text-xs mt-1 ${testStatus === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{testMsg}</p>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Ambiente</label>
          <select
            value={form.ambiente}
            onChange={e => update('ambiente', parseInt(e.target.value))}
            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white text-sm"
          >
            <option value={2}>2 - Homologação (Testes)</option>
            <option value={1}>1 - Produção</option>
          </select>
        </div>
      </div>

      {/* Dados do Emitente */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-white font-medium flex items-center gap-2">
          <Building2 size={18} className="text-amber-400" />
          Dados do Emitente
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">CNPJ</label>
            <Input placeholder="00.000.000/0000-00" value={form.cnpj_emitente} onChange={e => update('cnpj_emitente', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Inscrição Estadual</label>
            <Input placeholder="000000000" value={form.inscricao_estadual} onChange={e => update('inscricao_estadual', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Razão Social</label>
          <Input value={form.razao_social} onChange={e => update('razao_social', e.target.value)} className="bg-gray-900 border-gray-600" />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Nome Fantasia</label>
          <Input value={form.nome_fantasia} onChange={e => update('nome_fantasia', e.target.value)} className="bg-gray-900 border-gray-600" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">UF</label>
            <select value={form.uf} onChange={e => update('uf', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white text-sm">
              {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">CRT</label>
            <select value={form.crt} onChange={e => update('crt', parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white text-sm">
              {CRT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Telefone</label>
            <Input placeholder="(11) 99999-9999" value={form.telefone} onChange={e => update('telefone', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
        </div>
      </div>

      {/* Endereço do Emitente */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-white font-medium">Endereço do Emitente</h2>
        <p className="text-xs text-gray-500">Obrigatório para emissão de NFC-e. Os dados preenchem a seção [Emitente] do INI do ACBr.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm text-gray-400 mb-1 block">Logradouro</label>
            <Input value={form.endereco_logradouro} onChange={e => update('endereco_logradouro', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Número</label>
            <Input value={form.endereco_numero} onChange={e => update('endereco_numero', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Complemento</label>
            <Input value={form.endereco_complemento} onChange={e => update('endereco_complemento', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Bairro</label>
            <Input value={form.endereco_bairro} onChange={e => update('endereco_bairro', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Município</label>
            <Input value={form.endereco_municipio} onChange={e => update('endereco_municipio', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Código IBGE Município</label>
            <Input placeholder="3554003" value={form.codigo_municipio} onChange={e => update('codigo_municipio', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">CEP</label>
            <Input placeholder="00000-000" value={form.endereco_cep} onChange={e => update('endereco_cep', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
        </div>
      </div>

      {/* Configurações Fiscais */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-white font-medium">Configurações Fiscais NFC-e</h2>
        <p className="text-xs text-gray-500">CSC e Token são obtidos no portal da SEFAZ do estado. Estes dados também devem estar configurados no ACBrMonitor (aba DFe).</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">CSC ID (Código de Segurança)</label>
            <Input placeholder="1" value={form.csc_id} onChange={e => update('csc_id', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">CSC Token</label>
            <Input type="password" placeholder="Token do CSC" value={form.csc_token} onChange={e => update('csc_token', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Série NFC-e</label>
          <Input placeholder="1" value={form.serie_nfce} onChange={e => update('serie_nfce', e.target.value)} className="bg-gray-900 border-gray-600 max-w-[120px]" />
        </div>

        {form.ambiente === 1 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-yellow-400 mt-0.5" />
            <p className="text-xs text-yellow-300">
              Ambiente de <strong>Produção</strong> ativo. As notas emitidas terão validade fiscal.
            </p>
          </div>
        )}
      </div>

      {/* Responsável Técnico */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-white font-medium flex items-center gap-2">
          <UserCog size={18} className="text-gray-400" />
          Responsável Técnico (opcional)
        </h2>
        <p className="text-xs text-gray-500">Exigido por algumas UFs. Preencha se necessário.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">CNPJ</label>
            <Input value={form.resp_tec_cnpj} onChange={e => update('resp_tec_cnpj', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Contato</label>
            <Input value={form.resp_tec_contato} onChange={e => update('resp_tec_contato', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">E-mail</label>
            <Input value={form.resp_tec_email} onChange={e => update('resp_tec_email', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Telefone</label>
            <Input value={form.resp_tec_fone} onChange={e => update('resp_tec_fone', e.target.value)} className="bg-gray-900 border-gray-600" />
          </div>
        </div>
      </div>

      {/* Instruções ACBrMonitor */}
      <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-5 space-y-2">
        <h3 className="text-blue-300 font-medium text-sm">Como funciona a integração</h3>
        <ol className="text-xs text-blue-200/70 space-y-1 list-decimal list-inside">
          <li>O ACBrMonitor deve estar instalado e rodando com comunicação <strong>TCP/IP</strong> habilitada (porta 3434)</li>
          <li>O certificado digital A1 (.pfx) deve estar configurado na aba <strong>DFe</strong> do ACBrMonitor</li>
          <li>O CSC/Token e o ambiente (homologação/produção) devem estar configurados no ACBrMonitor <strong>e</strong> aqui</li>
          <li>O sistema envia o comando <code>NFe.CriarEnviarNFe</code> com o conteúdo INI do pedido ao ACBrMonitor</li>
          <li>O ACBrMonitor monta o XML, assina, envia à SEFAZ e retorna a resposta (chave, protocolo, status)</li>
        </ol>
      </div>

      {/* Botão Salvar */}
      <Button
        onClick={handleSalvar}
        className="bg-amber-600 hover:bg-amber-700 gap-2 w-full sm:w-auto"
        disabled={salvarConfig.isPending}
      >
        <Save size={18} />
        {salvarConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </div>
  )
}
