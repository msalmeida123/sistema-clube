'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save, Loader2 } from 'lucide-react'
import { DEPARTAMENTOS, type FuncionarioFormData, type Funcionario, type TipoContrato, type Turno } from '../types'

const TIPOS_CONTRATO: { value: TipoContrato; label: string }[] = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'estagiario', label: 'Estagiário' },
  { value: 'temporario', label: 'Temporário' },
  { value: 'freelancer', label: 'Freelancer' },
]

const TURNOS: { value: Turno; label: string }[] = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'integral', label: 'Integral' },
  { value: 'escala', label: 'Escala' },
]

interface FuncionarioFormProps {
  funcionario?: Funcionario | null
  onSubmit: (data: FuncionarioFormData) => Promise<void>
  onCancel: () => void
  loading: boolean
}

export function FuncionarioForm({ funcionario, onSubmit, onCancel, loading }: FuncionarioFormProps) {
  const [form, setForm] = useState<FuncionarioFormData>({
    nome: funcionario?.nome || '',
    cpf: funcionario?.cpf || '',
    cargo: funcionario?.cargo || '',
    departamento: funcionario?.departamento || '',
    tipo_contrato: funcionario?.tipo_contrato || 'clt',
    data_admissao: funcionario?.data_admissao || '',
    salario: funcionario?.salario || 0,
    turno: funcionario?.turno || 'integral',
    carga_horaria_semanal: funcionario?.carga_horaria_semanal || 44,
    email: funcionario?.email || '',
    telefone: funcionario?.telefone || '',
    celular: funcionario?.celular || '',
    data_nascimento: funcionario?.data_nascimento || '',
    sexo: funcionario?.sexo || undefined,
    estado_civil: funcionario?.estado_civil || '',
    cep: funcionario?.cep || '',
    endereco: funcionario?.endereco || '',
    numero: funcionario?.numero || '',
    complemento: funcionario?.complemento || '',
    bairro: funcionario?.bairro || '',
    cidade: funcionario?.cidade || '',
    estado: funcionario?.estado || '',
    banco: funcionario?.banco || '',
    agencia: funcionario?.agencia || '',
    conta: funcionario?.conta || '',
    tipo_conta: funcionario?.tipo_conta || undefined,
    chave_pix: funcionario?.chave_pix || '',
    ctps_numero: funcionario?.ctps_numero || '',
    ctps_serie: funcionario?.ctps_serie || '',
    pis: funcionario?.pis || '',
  })

  const handleChange = (field: keyof FuncionarioFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Nome Completo *</Label>
            <Input value={form.nome} onChange={(e) => handleChange('nome', e.target.value)} required />
          </div>
          <div>
            <Label>CPF *</Label>
            <Input value={form.cpf} onChange={(e) => handleChange('cpf', e.target.value)} placeholder="000.000.000-00" required />
          </div>
          <div>
            <Label>Data de Nascimento</Label>
            <Input type="date" value={form.data_nascimento || ''} onChange={(e) => handleChange('data_nascimento', e.target.value)} />
          </div>
          <div>
            <Label>Sexo</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.sexo || ''} onChange={(e) => handleChange('sexo', e.target.value || undefined)}>
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div>
            <Label>Estado Civil</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.estado_civil || ''} onChange={(e) => handleChange('estado_civil', e.target.value)}>
              <option value="">Selecione</option>
              <option value="solteiro">Solteiro(a)</option>
              <option value="casado">Casado(a)</option>
              <option value="divorciado">Divorciado(a)</option>
              <option value="viuvo">Viúvo(a)</option>
              <option value="uniao_estavel">União Estável</option>
            </select>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.telefone || ''} onChange={(e) => handleChange('telefone', e.target.value)} />
          </div>
          <div>
            <Label>Celular</Label>
            <Input value={form.celular || ''} onChange={(e) => handleChange('celular', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Dados Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Profissionais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Cargo *</Label>
            <Input value={form.cargo} onChange={(e) => handleChange('cargo', e.target.value)} required />
          </div>
          <div>
            <Label>Departamento *</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.departamento} onChange={(e) => handleChange('departamento', e.target.value)} required>
              <option value="">Selecione</option>
              {DEPARTAMENTOS.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tipo de Contrato *</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.tipo_contrato} onChange={(e) => handleChange('tipo_contrato', e.target.value)}>
              {TIPOS_CONTRATO.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Data de Admissão *</Label>
            <Input type="date" value={form.data_admissao} onChange={(e) => handleChange('data_admissao', e.target.value)} required />
          </div>
          <div>
            <Label>Salário *</Label>
            <Input type="number" step="0.01" min="0" value={form.salario} onChange={(e) => handleChange('salario', parseFloat(e.target.value) || 0)} required />
          </div>
          <div>
            <Label>Turno</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.turno} onChange={(e) => handleChange('turno', e.target.value)}>
              {TURNOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Carga Horária Semanal</Label>
            <Input type="number" min="1" max="60" value={form.carga_horaria_semanal} onChange={(e) => handleChange('carga_horaria_semanal', parseInt(e.target.value) || 44)} />
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>CEP</Label>
            <Input value={form.cep || ''} onChange={(e) => handleChange('cep', e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.endereco || ''} onChange={(e) => handleChange('endereco', e.target.value)} />
          </div>
          <div>
            <Label>Número</Label>
            <Input value={form.numero || ''} onChange={(e) => handleChange('numero', e.target.value)} />
          </div>
          <div>
            <Label>Complemento</Label>
            <Input value={form.complemento || ''} onChange={(e) => handleChange('complemento', e.target.value)} />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input value={form.bairro || ''} onChange={(e) => handleChange('bairro', e.target.value)} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.cidade || ''} onChange={(e) => handleChange('cidade', e.target.value)} />
          </div>
          <div>
            <Label>Estado</Label>
            <Input value={form.estado || ''} onChange={(e) => handleChange('estado', e.target.value)} maxLength={2} placeholder="SP" />
          </div>
        </CardContent>
      </Card>

      {/* Dados Bancários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Bancários</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Banco</Label>
            <Input value={form.banco || ''} onChange={(e) => handleChange('banco', e.target.value)} />
          </div>
          <div>
            <Label>Agência</Label>
            <Input value={form.agencia || ''} onChange={(e) => handleChange('agencia', e.target.value)} />
          </div>
          <div>
            <Label>Conta</Label>
            <Input value={form.conta || ''} onChange={(e) => handleChange('conta', e.target.value)} />
          </div>
          <div>
            <Label>Tipo de Conta</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.tipo_conta || ''} onChange={(e) => handleChange('tipo_conta', e.target.value || undefined)}>
              <option value="">Selecione</option>
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
              <option value="pix">PIX</option>
            </select>
          </div>
          <div>
            <Label>Chave PIX</Label>
            <Input value={form.chave_pix || ''} onChange={(e) => handleChange('chave_pix', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Documentos Trabalhistas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos Trabalhistas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>CTPS Número</Label>
            <Input value={form.ctps_numero || ''} onChange={(e) => handleChange('ctps_numero', e.target.value)} />
          </div>
          <div>
            <Label>CTPS Série</Label>
            <Input value={form.ctps_serie || ''} onChange={(e) => handleChange('ctps_serie', e.target.value)} />
          </div>
          <div>
            <Label>PIS/PASEP</Label>
            <Input value={form.pis || ''} onChange={(e) => handleChange('pis', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" /> Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {funcionario ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}
