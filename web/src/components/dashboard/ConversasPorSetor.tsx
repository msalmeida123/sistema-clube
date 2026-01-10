'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, MessageSquare, AlertTriangle } from 'lucide-react'
import { ConversaPorSetor, getConversasPorSetor } from '@/lib/supabase-views'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

export function ConversasPorSetor() {
  const [setores, setSetores] = useState<ConversaPorSetor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getConversasPorSetor()
      setSetores(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-500" />
            Conversas por Setor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const maxTotal = Math.max(...setores.map(s => s.total), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-500" />
          Conversas por Setor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {setores.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum setor cadastrado
          </p>
        ) : (
          <div className="space-y-4">
            {setores.map((setor) => (
              <div key={setor.setor_id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: setor.setor_cor || '#3B82F6' }}
                    />
                    <span className="font-medium">{setor.setor_nome}</span>
                  </div>
                  <span className="text-lg font-bold">{setor.total}</span>
                </div>
                
                <div className="relative">
                  <Progress 
                    value={(setor.total / maxTotal) * 100} 
                    className="h-2"
                    style={{ 
                      ['--progress-color' as any]: setor.setor_cor || '#3B82F6' 
                    }}
                  />
                </div>

                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {setor.novos} novos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    {setor.em_atendimento} em atendimento
                  </span>
                  {setor.urgentes > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertTriangle className="h-3 w-3" />
                      {setor.urgentes} urgentes
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
