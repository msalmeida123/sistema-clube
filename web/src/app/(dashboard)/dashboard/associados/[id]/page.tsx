'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, CreditCard, Edit, User, MapPin, Phone, Mail, FileText } from 'lucide-react'
import Link from 'next/link'

export default function AssociadoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [associado, setAssociado] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAssociado() {
      const { data, error } = await supabase
        .from('associados')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Erro ao buscar associado:', error)
      } else {
        setAssociado(data)
      }
      setLoading(false)
    }

    if (params.id) {
      fetchAssociado()
    }
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!associado) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p>Associado não encontrado</p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    ativo: 'bg-green-100 text-green-800',
    inativo: 'bg-gray-100 text-gray-800',
    suspenso: 'bg-yellow-100 text-yellow-800',
    expulso: 'bg-red-100 text-red-800',
  }

  const planoColors: Record<string, string> = {
    individual: 'bg-blue-100 text-blue-800',
    familiar: 'bg-purple-100 text-purple-800',
    patrimonial: 'bg-amber-100 text-amber-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Detalhes do Associado</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card Principal */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={associado.foto_url} />
                <AvatarFallback className="text-3xl">
                  {associado.nome?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{associado.nome}</h2>
              <p className="text-muted-foreground">Título: {associado.numero_titulo}</p>
              <div className="flex gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${planoColors[associado.plano] || ''}`}>
                  {associado.plano}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[associado.status] || ''}`}>
                  {associado.status}
                </span>
              </div>
              <div className="flex flex-col gap-2 mt-6 w-full">
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" asChild>
                    <Link href={`/dashboard/associados/${params.id}/editar`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href={`/dashboard/associados/${params.id}/carteirinha`}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Carteirinha
                    </Link>
                  </Button>
                </div>
                <Button className="w-full" variant="secondary" asChild>
                  <Link href={`/dashboard/associados/${params.id}/contrato`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Contrato
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Pessoais */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{associado.cpf || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RG</p>
                <p className="font-medium">{associado.rg || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                <p className="font-medium">
                  {associado.data_nascimento 
                    ? new Date(associado.data_nascimento).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Título de Eleitor</p>
                <p className="font-medium">{associado.titulo_eleitor || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Associação</p>
                <p className="font-medium">
                  {associado.data_associacao 
                    ? new Date(associado.data_associacao).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{associado.email || '-'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{associado.telefone || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Logradouro</p>
                <p className="font-medium">
                  {associado.endereco ? `${associado.endereco}, ${associado.numero}` : '-'}
                  {associado.complemento && ` - ${associado.complemento}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bairro</p>
                <p className="font-medium">{associado.bairro || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cidade/Estado</p>
                <p className="font-medium">
                  {associado.cidade && associado.estado 
                    ? `${associado.cidade}/${associado.estado}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CEP</p>
                <p className="font-medium">{associado.cep || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Residência</p>
                <p className="font-medium">{associado.tipo_residencia || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
