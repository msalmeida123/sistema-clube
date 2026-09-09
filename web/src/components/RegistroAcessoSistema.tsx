'use client'
import {useEffect} from 'react'
import {usePathname} from 'next/navigation'
import {createClient} from '@/lib/supabase/client'
export function RegistroAcessoSistema(){const caminho=usePathname();useEffect(()=>{if(caminho)void createClient().rpc('sistema_registrar_acesso',{p_caminho:caminho}).then(()=>undefined)},[caminho]);return null}
