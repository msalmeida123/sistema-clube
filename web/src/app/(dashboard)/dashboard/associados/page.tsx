'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Search, Eye, Edit, CreditCard, FileText } from 'lucide-react'
import { formatCPF } from '@/lib/utils'
import type { Associado } from '@/types/database'

export default function AssociadosPage() {
  const [associados, setAssociados] = useState<Associado[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchAssociados = async () => {
      let query = supabase.from('associados').select('*').order('nome')
      if (search) query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`)
      const { data } = await query
      setAssociados(data || [])
      setLoading(false)
    }
    fetchAssociados()
  }, [supabase, search])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { ativo: 'bg-green-100 text-green-800', inativo: 'bg-gray-100 text-gray-800', suspenso: 'bg-yellow-100 text-yellow-800', expulso: 'bg-red-100 text-red-800' }
    return colors[status] || 'bg-gray-100'
  }

  const getPlanoColor = (plano: string) => {
    const colors: Record<string, string> = { individual: 'bg-blue-100 text-blue-800', familiar: 'bg-green-100 text-green-800', patrimonial: 'bg-yellow-100 text-yellow-800' }
    return colors[plano] || 'bg-gray-100'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CPF..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Link href="/dashboard/associados/novo">
          <Button><Plus className="h-4 w-4 mr-2" />Novo Associado</Button>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Associados ({associados.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Carregando...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Associado</th>
                    <th className="text-left py-3 px-4">Título</th>
                    <th className="text-left py-3 px-4">CPF</th>
                    <th className="text-left py-3 px-4">Plano</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {associados.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarImage src={a.foto_url} /><AvatarFallback>{a.nome[0]}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-medium">{a.nome}</p>
                            <p className="text-sm text-muted-foreground">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{a.numero_titulo}</td>
                      <td className="py-3 px-4">{formatCPF(a.cpf)}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPlanoColor(a.plano)}`}>{a.plano}</span></td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(a.status)}`}>{a.status}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link href={`/dashboard/associados/${a.id}`}><Button variant="ghost" size="icon" title="Ver detalhes"><Eye className="h-4 w-4" /></Button></Link>
                          <Link href={`/dashboard/associados/${a.id}/editar`}><Button variant="ghost" size="icon" title="Editar"><Edit className="h-4 w-4" /></Button></Link>
                          <Link href={`/dashboard/associados/${a.id}/carteirinha`}><Button variant="ghost" size="icon" title="Carteirinha"><CreditCard className="h-4 w-4" /></Button></Link>
                          <Link href={`/dashboard/associados/${a.id}/contrato`}><Button variant="ghost" size="icon" title="Contrato"><FileText className="h-4 w-4" /></Button></Link>
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
