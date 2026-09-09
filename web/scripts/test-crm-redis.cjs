const {Queue,Worker,QueueEvents}=require('bullmq');
const assert=require('node:assert/strict');
(async()=>{
 const connection={host:'127.0.0.1',port:16379};
 const name='crm-test-'+Date.now();const queue=new Queue(name,{connection});const events=new QueueEvents(name,{connection});await events.waitUntilReady();
 await queue.setGlobalConcurrency(1);
 const starts=[];let active=0,maxActive=0;
 const handler=async job=>{active++;maxActive=Math.max(maxActive,active);starts.push({id:job.id,time:Date.now()});await new Promise(r=>setTimeout(r,50));active--;return 'simulado'};
 const first=await queue.add('envio',{fake:true},{jobId:'unico'});
 await queue.add('envio',{fake:true},{jobId:'unico'});
 assert.equal(await queue.getWaitingCount(),1,'deduplicação');
 const second=await queue.add('envio',{fake:true},{jobId:'segundo'});
 const w1=new Worker(name,handler,{connection,limiter:{max:1,duration:1100},concurrency:1});
 const w2=new Worker(name,handler,{connection,limiter:{max:1,duration:1100},concurrency:1});
 try {
 await Promise.all([first.waitUntilFinished(events,10000),second.waitUntilFinished(events,10000)]);
 assert.equal(starts.length,2);assert.equal(maxActive,1);assert.ok(starts[1].time-starts[0].time>=1000,'intervalo global');
 console.log('PASS: deduplicação, FIFO, concorrência global 1, intervalo entre envios com dois workers');
 } finally {await w1.close();await w2.close();await queue.obliterate({force:true});await events.close();await queue.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
