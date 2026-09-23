'use client'
import {Input,InputProps} from '@/components/ui/input'
import {limitesAssociado} from '@/lib/validacao-associado'
export function InputAssociado({erro,name,id,...props}:InputProps&{erro?:string}){
 const campoId=id||`associado-${name}`
 return <div className="w-full"><Input {...props} name={name} id={campoId} maxLength={props.maxLength??limitesAssociado[name||'']} aria-invalid={!!erro} aria-describedby={erro?`${campoId}-erro`:undefined} className={[props.className,erro?'border-red-600 bg-red-50 focus-visible:ring-red-600':''].filter(Boolean).join(' ')}/>{erro&&<p id={`${campoId}-erro`} role="alert" className="mt-1 text-sm text-red-700">{erro}</p>}</div>
}
