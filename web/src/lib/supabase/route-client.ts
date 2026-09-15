import {createRouteHandlerClient as legacyClient} from '@supabase/auth-helpers-nextjs'
import {cookies} from 'next/headers'
import {fetchInterno} from './fetch-interno'

// Resolver os cookies assincronos do Next antes de entregar o armazenamento ao adapter.
// Preserva o formato das sessoes existentes e suas operacoes get/set.
export async function createRouteHandlerClient(
  context: {cookies: () => ReturnType<typeof cookies> | Awaited<ReturnType<typeof cookies>>},
  config: Parameters<typeof legacyClient>[1] = {}
) {
  const store = await context.cookies()
  return legacyClient({cookies: () => store as unknown as ReturnType<typeof cookies>}, {
    ...config,
    options: {...config?.options, global: {...config?.options?.global, fetch: fetchInterno}}
  })
}
