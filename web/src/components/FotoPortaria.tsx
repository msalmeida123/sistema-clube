
'use client'
import {useState} from 'react'
import {User} from 'lucide-react'

export function FotoPortaria({url,nome,tipo}:{url?:string|null;nome:string;tipo?:string}){
 const [falhou,setFalhou]=useState(false)
 return <figure className="w-40 shrink-0 text-center">
  <div className="h-48 w-40 overflow-hidden rounded-xl border-2 border-gray-300 bg-white flex items-center justify-center">
   {url&&!falhou?<img src={url} alt={`Foto de ${nome}`} className="h-full w-full object-contain object-center" onError={()=>setFalhou(true)}/>:<div className="p-3 text-gray-600"><User className="mx-auto h-16 w-16" aria-hidden="true"/><p className="mt-2 text-sm">{url?'Foto indisponível':'Sem foto cadastrada'}</p></div>}
  </div>
  <figcaption className="mt-2 text-sm font-semibold">{tipo==='dependente'?'Dependente':'Titular'}</figcaption>
 </figure>
}
