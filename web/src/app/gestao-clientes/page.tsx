import {notFound} from 'next/navigation'
import {donoGestao,ErroGestao} from '@/lib/gestao-licencas/servidor'
import {PainelGestaoClientes} from '@/components/PainelGestaoClientes'
export const dynamic='force-dynamic'
export default async function GestaoClientes(){
 try{await donoGestao()}catch(e){if(e instanceof ErroGestao&&e.status===404)notFound();return <main className="mx-auto max-w-lg space-y-4 p-8"><h1 className="text-2xl font-semibold">Acesso ao painel central</h1><p>Entre com a conta do proprietário autorizado para gerenciar clientes e licenças.</p><a href="/login" className="underline">Entrar com outra conta</a></main>}
 return <PainelGestaoClientes/>
}
