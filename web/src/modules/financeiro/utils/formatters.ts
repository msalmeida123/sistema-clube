// Utilitários de formatação do módulo Financeiro

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value || 0)
}

export const formatDate = (date: string): string => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pago: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    atrasado: 'bg-red-100 text-red-700',
    cancelado: 'bg-gray-100 text-gray-600',
    utilizado: 'bg-green-100 text-green-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}
