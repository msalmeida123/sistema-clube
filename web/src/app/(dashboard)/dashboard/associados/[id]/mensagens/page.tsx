'use client'
import {useParams} from 'next/navigation'
import Link from 'next/link'
import {MensagensClube} from '@/components/MensagensClube'
export default function ConversaAssociado(){const {id}=useParams();return <div className="max-w-3xl mx-auto p-4"><Link className="inline-block py-3 underline" href="/dashboard/associados/mensagens">← Voltar para mensagens</Link><MensagensClube tipo="equipe" associadoId={String(id)}/></div>}
