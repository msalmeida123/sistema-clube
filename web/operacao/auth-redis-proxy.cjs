// Único destino do cluster Auth no Envoy. Sem porta publicada no host.
const http=require('node:http');
const {consume}=require('./login-rate.cjs');
const upstream=new URL(process.env.AUTH_UPSTREAM||'http://auth:9999');
const hop=new Set(['connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','transfer-encoding','upgrade']);
function headers(source){return Object.fromEntries(Object.entries(source).filter(([k])=>!hop.has(k.toLowerCase())))}
function fail(res,status,msg,retry){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store',...(retry?{'retry-after':String(retry)}:{})});res.end(JSON.stringify({error:status===429?'over_request_rate_limit':'temporarily_unavailable',error_description:msg,msg}));}
function createServer(limit=consume){return http.createServer(async(req,res)=>{
 let body;
 try{
  const url=new URL(req.url,'http://local');
  if(req.method==='POST'&&url.searchParams.get('grant_type')==='password'){
   const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>16384){fail(res,413,'Solicitação muito grande.');return}chunks.push(chunk)}
   body=Buffer.concat(chunks);
   let parsed;try{parsed=JSON.parse(body.toString('utf8'))}catch{fail(res,400,'Solicitação inválida.');return}
   if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)){fail(res,400,'Solicitação inválida.');return}
   const fields=Object.fromEntries(Object.entries(parsed).map(([k,v])=>[k.toLowerCase(),v]));
   const identity=typeof fields.email==='string'?fields.email:typeof fields.phone==='string'?fields.phone:'';
   if(!identity||identity.length>320){fail(res,400,'Informe o usuário e a senha.');return}
   const result=await limit('sistema',identity,20);
   if(!result.allowed){fail(res,429,'Muitas tentativas. Aguarde antes de tentar novamente.',result.retryAfter);return}
  }
  const forwarded=headers(req.headers);forwarded.host=upstream.host;
  const proxy=http.request({hostname:upstream.hostname,port:upstream.port||80,path:req.url,method:req.method,headers:forwarded},r=>{res.writeHead(r.statusCode,headers(r.headers));r.pipe(res)});
  proxy.setTimeout(15000,()=>proxy.destroy());proxy.on('error',()=>{if(!res.headersSent)fail(res,502,'Autenticação temporariamente indisponível.');else res.destroy()});
  res.on('close',()=>{if(!res.writableEnded)proxy.destroy()});
  if(body)proxy.end(body);else req.pipe(proxy);
 }catch{if(!res.headersSent)fail(res,503,'Autenticação temporariamente indisponível. Tente novamente.');else res.destroy()}
})}
if(require.main===module){const server=createServer();server.listen(Number(process.env.PORT||9998),'0.0.0.0');process.on('SIGTERM',()=>server.close(()=>process.exit(0)));}
module.exports={createServer};
