const Redis = require('ioredis');
const {createHash}=require('node:crypto');
const SCRIPT=`local n=redis.call('INCR',KEYS[1]); if n==1 or redis.call('PTTL',KEYS[1])<0 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('PTTL',KEYS[1])}`;
let client;
function getRedis(){
 if(!process.env.REDIS_URL)throw new Error('Redis não configurado');
 if(!client){client=new Redis(process.env.REDIS_URL,{lazyConnect:true,enableOfflineQueue:false,maxRetriesPerRequest:0,connectTimeout:1500,commandTimeout:2000,retryStrategy:()=>1000});client.on('error',()=>{});}
 return client;
}
async function consume(scope,identifier,max=20,windowMs=900000,redis=getRedis()){
 if(redis.status==='wait')await redis.connect();
 else if(redis.status!=='ready')await new Promise((resolve,reject)=>{
  const done=()=>{clearTimeout(timer);redis.off('ready',done);resolve()};
  const timer=setTimeout(()=>{redis.off('ready',done);reject(new Error('Redis indisponível'))},2000);redis.once('ready',done);
 });
 const key=(process.env.LOGIN_RATE_NAMESPACE||'clube-login-v1')+':'+scope+':'+createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');
 const [count,ttl]=await redis.eval(SCRIPT,1,key,windowMs);
 return {allowed:Number(count)<=max,retryAfter:Math.max(1,Math.ceil(Number(ttl)/1000))};
}
module.exports={consume,SCRIPT};
