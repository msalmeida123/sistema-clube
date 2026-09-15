/** Mantém URL pública e cookies no SDK; muda somente o transporte no servidor. */
export const fetchInterno: typeof fetch = (input, init) => {
  const internal = process.env.SUPABASE_INTERNAL_URL
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (typeof window !== 'undefined' || !internal || !publicUrl) return fetch(input, init)
  const original = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
  const source = new URL(publicUrl)
  const prefix = source.pathname.replace(/\/$/, '')
  if (original.origin !== source.origin || !original.pathname.startsWith(prefix + '/')) return fetch(input, init)
  const target = new URL(internal)
  target.pathname = target.pathname.replace(/\/$/, '') + original.pathname.slice(prefix.length)
  target.search = original.search
  return fetch(input instanceof Request ? new Request(target, input) : target.toString(), init)
}
