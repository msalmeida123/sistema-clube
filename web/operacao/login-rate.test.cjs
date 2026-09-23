const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {consume}=require('./login-rate.cjs');
test('contadores usam hash, TTL e limite e não gravam identificador puro',async()=>{let args;const redis={status:'ready',eval:async(...a)=>{args=a;return [21,12500]}};const r=await consume('sistema',' TESTE@EXAMPLE.COM ',20,900000,redis);assert.equal(r.allowed,false);assert.equal(r.retryAfter,13);assert.equal(args[3],900000);assert(!args[2].includes('example'));const key=args[2];await consume('sistema','teste@example.com',20,900000,redis);assert.equal(args[2],key);await consume('associado','teste@example.com',20,900000,redis);assert.notEqual(args[2],key)});
test('falha do Redis não permite login',async()=>{await assert.rejects(consume('sistema','teste',20,900000,{status:'ready',eval:async()=>{throw Error('offline')}}))});
test('proxy bloqueia antes do Auth, falha fechado e preserva renovação de sessão',async()=>{
 let calls=0,checks=0,mode='block';const upstream=http.createServer((req,res)=>{calls++;req.resume();res.setHeader('set-cookie',['a=1; HttpOnly','b=2; HttpOnly']);res.end('ok')});await new Promise(r=>upstream.listen(0,'127.0.0.1',r));process.env.AUTH_UPSTREAM='http://127.0.0.1:'+upstream.address().port;
 const {createServer}=require('./auth-redis-proxy.cjs');const proxy=createServer(async()=>{checks++;if(mode==='error')throw Error('offline');return {allowed:mode==='allow',retryAfter:900}});await new Promise(r=>proxy.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+proxy.address().port;
 try{
  let r=await fetch(url+'/token?grant_type=password',{method:'POST',body:JSON.stringify({email:'test@example.com',password:'invalid'})});assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'900');assert.equal(calls,0);
  mode='error';r=await fetch(url+'/token?grant_type=password',{method:'POST',body:JSON.stringify({email:'test@example.com'})});assert.equal(r.status,503);assert.equal(calls,0);
  r=await fetch(url+'/token?grant_type=refresh_token',{method:'POST',body:'{}'});assert.equal(r.status,200);assert.equal(checks,2);assert.equal(calls,1);assert.equal(r.headers.getSetCookie().length,2);
  mode='allow';r=await fetch(url+'/token?grant_type=password',{method:'POST',body:JSON.stringify({EMAIL:'test@example.com',password:'invalid'})});assert.equal(r.status,200);assert.equal(calls,2);
 }finally{proxy.closeAllConnections();upstream.closeAllConnections();await Promise.all([new Promise(r=>proxy.close(r)),new Promise(r=>upstream.close(r))])}
});
