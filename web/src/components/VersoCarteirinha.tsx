 'use client'
import {useState} from 'react'
export default function VersoCarteirinha({nome='CLUBE'}:{nome?:string}){
 const [ausente,setAusente]=useState(false)
 return <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
 {ausente?<span className="text-white text-2xl font-bold">{nome}</span>:<img src="/api/tema/verso-carteirinha" alt="Verso da carteirinha" className="w-full h-full object-contain bg-white" onError={()=>setAusente(true)}/>}
 </div>
}
