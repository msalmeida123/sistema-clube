import {Queue} from 'bullmq'
import {redisConnection} from '@/lib/whatsapp/queue'
let fila:Queue|undefined
export function filaContatos(){
 if(!fila){fila=new Queue('clube-sync-contatos',{connection:{...redisConnection(),enableOfflineQueue:false},defaultJobOptions:{attempts:3,backoff:{type:'exponential',delay:10000},removeOnComplete:{age:86400,count:200},removeOnFail:{age:604800,count:200}}});fila.on('error',()=>console.error('Fila de contatos indisponível'))}
 return fila
}
