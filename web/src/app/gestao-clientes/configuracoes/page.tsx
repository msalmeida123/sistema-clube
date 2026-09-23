import Link from 'next/link'
import {notFound} from 'next/navigation'
import {donoGestao,ErroGestao} from '@/lib/gestao-licencas/servidor'
import {ConfiguracoesGestao} from '@/components/ConfiguracoesGestao'
export const dynamic='force-dynamic'
export default async function Configuracoes(){
 try{await donoGestao(undefined,true)}catch(e){if(e instanceof ErroGestao&&e.status===404)notFound();return <main className="mx-auto max-w-lg space-y-4 p-8"><h1 className="text-2xl font-semibold">Configurações da gestão</h1><p>Acesso exclusivo ao proprietário autorizado.</p><Link href="/login" className="underline">Entrar com a conta Administrador Local</Link></main>}
 return <ConfiguracoesGestao/>
}
