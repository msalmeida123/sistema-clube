// Componente de Busca - Responsável APENAS por input de busca
'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface AssociadoSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AssociadoSearch({ 
  value, 
  onChange, 
  placeholder = 'Buscar por nome ou CPF...' 
}: AssociadoSearchProps) {
  return (
    <div className="relative w-72">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
