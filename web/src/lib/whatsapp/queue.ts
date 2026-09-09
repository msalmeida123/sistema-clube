import { Queue } from 'bullmq'

export const QUEUE_NAME = 'crm-whatsapp'
export function redisConnection() {
  const url = new URL(process.env.REDIS_URL || 'redis://crm-redis:6379')
  return { host: url.hostname, port: Number(url.port || 6379), password: url.password ? decodeURIComponent(url.password) : undefined,
    username: url.username || undefined, maxRetriesPerRequest: 1, connectTimeout: 3000,
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}) }
}
let queue: Queue | undefined
export function getCrmQueue() {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection: redisConnection(), defaultJobOptions: {
      attempts: 1, removeOnComplete: { age: 604800, count: 1000 }, removeOnFail: { age: 604800, count: 1000 }
    } })
    queue.on('error', () => { console.error('Fila CRM: Redis indisponível') })
  }
  return queue
}
