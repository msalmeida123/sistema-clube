export type RegraRota = { rota: string; pode_visualizar: boolean; pode_criar: boolean; pode_editar: boolean }
export function permiteRota(regras: RegraRota[], rota: string): boolean {
  // Apenas informações de suporte; autenticação e usuário ativo são verificados no middleware/API.
  if (rota === '/dashboard/suporte') return true
  const r = [...regras].sort((a,b) => b.rota.length-a.rota.length).find(r => r.rota === rota || (r.rota !== '/dashboard' && rota.startsWith(r.rota + '/')))
  return !!r?.pode_visualizar && (!rota.endsWith('/novo') || r.pode_criar) && (!rota.endsWith('/editar') || r.pode_editar)
}
