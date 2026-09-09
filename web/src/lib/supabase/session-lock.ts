import { processLock } from '@supabase/supabase-js'

/** O timeout zero é usado pelo refresh em segundo plano: se outra aba estiver
 * renovando a sessão, este ciclo pode ser ignorado sem criar uma rejeição nativa. */
export async function sessionLock<R>(name: string, timeout: number, fn: () => Promise<R>): Promise<R> {
  if (typeof navigator === 'undefined' || !navigator.locks) return processLock(name, timeout, fn)
  if (timeout === 0) {
    return navigator.locks.request(name, { mode: 'exclusive', ifAvailable: true }, lock =>
      lock ? fn() : undefined as R
    )
  }
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  let waiting = true
  if (timeout > 0) timer = setTimeout(() => { if (waiting) controller.abort() }, timeout)
  try {
    return await navigator.locks.request(name, { mode: 'exclusive', signal: controller.signal }, () => {
      waiting = false
      clearTimeout(timer)
      return fn()
    })
  } catch (error) {
    if (waiting && controller.signal.aborted) {
      const expired = new Error('Tempo esgotado aguardando a sessão') as Error & { isAcquireTimeout: boolean }
      expired.isAcquireTimeout = true
      throw expired
    }
    throw error
  } finally { clearTimeout(timer) }
}
