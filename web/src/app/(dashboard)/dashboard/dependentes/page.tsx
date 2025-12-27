'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Search, Eye, Edit, Trash2, Users, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type Dependente = {
  id: string
  nome: string
  cpf: string
  data_nascimento: string
  parentesco: string
  foto_url: string | null
  associado: {
    id: string
    nome: string
    numero_titulo: number
    plano: string
  }
}

const PARENTESCOS: Record<string, string> = {
  conjuge: 'Cônjuge',
  filho: 'Filho(a)',
  filho_universitario: 'Filho(a) Universitário',
  pai: 'Pai',
  mae: 'Mãe',
  sogra: 'Sogra',
  enteado: 'Enteado(a)',
  adotado: 'Filho(a) Adotado',
}

export default function DependentesPage() {
  const [dependentes, setDependentes] = useState<Dependente[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchDependentes = async () => {
    const { data } = await supabase
      .from('dependentes')
      .select('*, associado:associados(id, nome, numero_titulo, plano)')
      .order('nome')

    let resultado = data || []
    if (search) {
      resultado = resultado.filter((d: any) =>
        d.nome?.toLowerCase().includes(search.toLowerCase()) ||
        d.cpf?.includes(search) ||
        d.associado?.nome?.toLowerCase().includes(search.toLowerCase())
      )
    }

    setDependentes(resultado as Dependente[])
    setLoading(false)
  }

  useEffect(() => {
    fetchDependentes()
  }, [supabase, search])

  const calcularIdade = (dataNasc: string) => {
    const hoje = new Date()
    const nascimento = new Date(dataNasc)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const m = hoje.getMonth() - nascimento.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--
    return idade
  }

  const excluirDependente = async (id: string, nome: string) => {
    if (!confirm(`Deseja excluir o dependente "${nome}"?`)) return

    const { error } = await supabase.from('dependentes').delete().eq('id', id)

    if (error) {
      toast.error('Erro ao excluir dependente')
    } else {
      toast.success('Dependente excluído')
      fetchDependentes()
    }
  }

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar dependente ou titular..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href="/dashboard/dependentes/novo">
          <Button><Plus className="h-4 w-4 mr-2" />Novo Dependente</Button>
        </Link>
      </div>

      {/* Aviso sobre planos */}
      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">
          <strong>Atenção:</strong> Conforme Art. 20 do Estatuto, apenas associados dos planos <strong>Familiar</strong> e <strong>Patrimonial</strong> podem cadastrar dependentes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dependentes ({dependentes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p>Carregando...</p> : dependentes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum dependente cadastrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Dependente</th>
                    <th className="text-left py-3 px-4">Parentesco</th>
                    <th className="text-left py-3 px-4">Idade</th>
                    <th className="text-left py-3 px-4">Titular</th>
                    <th className="text-left py-3 px-4">Plano</th>
                    <th className="text-left py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dependentes.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={d.foto_url || ''} />
                            <AvatarFallback>{d.nome?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{d.nome}</p>
                            <p className="text-sm text-muted-foreground">{d.cpf}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{PARENTESCOS[d.parentesco] || d.parentesco}</td>
                      <td className="py-3 px-4">
                        {calcularIdade(d.data_nascimento)} anos
                        <p className="text-xs text-muted-foreground">{formatarData(d.data_nascimento)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{d.associado?.nome}</p>
                        <p className="text-sm text-muted-foreground">Título: {d.associado?.numero_titulo}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          d.associado?.plano === 'patrimonial' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {d.associado?.plano}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Link href={`/dashboard/dependentes/${d.id}`}>
                            <Button variant="ghost" size="icon" title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/dependentes/${d.id}/editar`}>
                            <Button variant="ghost" size="icon" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => excluirDependente(d.id, d.nome)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
