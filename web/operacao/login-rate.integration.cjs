const {consume}=require('./login-rate.cjs');
const assert=require('node:assert/strict');
process.env.LOGIN_RATE_NAMESPACE='test-login-'+require('node:crypto').randomUUID();
(async()=>{
 const r=await Promise.all(Array.from({length:30},()=>consume('sistema','fixture@example.invalid',20,3000)));
 assert.equal(r.filter(x=>x.allowed).length,20);assert.equal(r.filter(x=>!x.allowed).length,10);
 assert((await consume('associado','00000000000',20,3000)).allowed);
 assert((await consume('expiry','fixture',1,100)).allowed);assert(!(await consume('expiry','fixture',1,100)).allowed);
 await new Promise(r=>setTimeout(r,160));assert((await consume('expiry','fixture',1,100)).allowed);
 console.log('Redis real: concorrência, separação e expiração aprovadas.');process.exit(0);
})().catch(e=>{console.error(e.message);process.exit(1)});
