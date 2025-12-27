'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, Stethoscope, FileText, CheckCircle, XCircle, AlertTriangle, Printer } from 'lucide-react'

export default function DetalhesExamePage() {
  const { id } = useParams()
  const [exame, setExame] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchExame = async () => {
      const { data } = await supabase
        .from('exames_medicos')
        .select('*, associado:associados(id, nome, cpf, numero_titulo, foto_url, data_nascimento)')
        .eq('id', id)
        .single()

      setExame(data)
      setLoading(false)
    }
    fetchExame()
  }, [id, supabase])

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>
  if (!exame) return <div className="text-center p-8">Exame não encontrado</div>

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR')

  const getStatusExame = () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const validade = new Date(exame.data_validade)
    const em30dias = new Date()
    em30dias.setDate(em30dias.getDate() + 30)

    if (validade < hoje) {
      return { status: 'VENCIDO', cor: 'bg-red-100 text-red-800 border-red-300', icon: XCircle }
    } else if (validade <= em30dias) {
      return { status: 'A VENCER', cor: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertTriangle }
    } else {
      return { status: 'VÁLIDO', cor: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle }
    }
  }

  const diasParaVencer = () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const validade = new Date(exame.data_validade)
    return Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  }

  const statusInfo = getStatusExame()
  const dias = diasParaVencer()

  const getTipoExameLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      piscina: 'Piscina (Dermatológico)',
      periodico: 'Periódico',
    }
    return tipos[tipo] || tipo
  }

  const getResultadoLabel = (resultado: string) => {
    const resultados: Record<string, string> = {
      apto: 'Apto',
      apto_restricao: 'Apto com Restrição',
      inapto: 'Inapto',
    }
    return resultados[resultado] || resultado
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exames-medicos">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Detalhes do Exame Médico
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />Imprimir
          </Button>
          <Link href={`/dashboard/exames-medicos/${id}/editar`}>
            <Button><Edit className="h-4 w-4 mr-2" />Editar</Button>
          </Link>
        </div>
      </div>

      {/* Status Grande */}
      <Card className={`border-2 ${statusInfo.cor}`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <statusInfo.icon className="h-16 w-16" />
              <div>
                <p className="text-3xl font-bold">{statusInfo.status}</p>
                <p className="text-lg">
                  {dias > 0 ? `Válido por mais ${dias} dias` : dias === 0 ? 'Vence hoje!' : `Vencido há ${Math.abs(dias)} dias`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Validade</p>
              <p className="text-2xl font-bold">{formatarData(exame.data_validade)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Associado */}
      <Card>
        <CardHeader>
          <CardTitle>Associado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {exame.associado?.foto_url ? (
                <img src={exame.associado.foto_url} alt={exame.associado.nome} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-medium">{exame.associado?.nome?.[0]}</span>
              )}
            </div>
            <div>
              <p className="text-xl font-bold">{exame.associado?.nome}</p>
              <p className="text-muted-foreground">Título: {exame.associado?.numero_titulo}</p>
              <p className="text-muted-foreground">CPF: {exame.associado?.cpf}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Exame */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Exame</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Exame</p>
              <p className="text-lg font-medium">{getTipoExameLabel(exame.tipo_exame)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resultado</p>
              <p className={`text-lg font-medium ${exame.resultado === 'apto' ? 'text-green-600' : exame.resultado === 'inapto' ? 'text-red-600' : 'text-yellow-600'}`}>
                {getResultadoLabel(exame.resultado)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data do Exame</p>
              <p className="text-lg font-medium">{formatarData(exame.data_exame)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Validade</p>
              <p className="text-lg font-medium">{formatarData(exame.data_validade)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Médico */}
      <Card>
        <CardHeader>
          <CardTitle>Médico Responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nome do Médico</p>
              <p className="text-lg font-medium">{exame.medico_nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CRM</p>
              <p className="text-lg font-medium">{exame.crm}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {exame.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{exame.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Arquivo Anexo */}
      {exame.arquivo_url && (
        <Card>
          <CardHeader>
            <CardTitle>Atestado Anexado</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={exame.arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-5 w-5" />
              Visualizar Atestado
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
