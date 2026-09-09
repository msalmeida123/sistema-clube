import {isIP} from 'node:net'
import https from 'node:https'
import http from 'node:http'

export function validarConfigPonto(v:any){
 const ip=String(v.ip||'').trim(),p=ip.split('.').map(Number)
 if(ip&&!(isIP(ip)===4&&(p[0]===10||(p[0]===192&&p[1]===168)||(p[0]===172&&p[1]>=16&&p[1]<=31))))throw new Error('Informe um IPv4 da rede local do aparelho.')
 if(!Number.isInteger(v.porta)||v.porta<1||v.porta>65535)throw new Error('Porta inválida.')
 if(!['https','http'].includes(v.protocolo))throw new Error('Protocolo inválido.')
 if(typeof v.certificado_local!=='boolean')throw new Error('Configuração de certificado inválida.')
 const texto=(campo:string,max:number)=>{if(typeof v[campo]!=='string'||v[campo].length>max)throw new Error('Campo inválido: '+campo);return v[campo].trim()}
 return {ip,porta:v.porta,protocolo:v.protocolo,certificado_local:v.certificado_local,usuario:texto('usuario',100),nome:texto('nome',100),empresa_nome:texto('empresa_nome',160),empresa_documento:texto('empresa_documento',30)}
}
export type ConfigPonto=ReturnType<typeof validarConfigPonto>&{senha:string}

// Only fixed, read-only commands are exposed; no redirects or arbitrary URLs.
export function requisicaoControlId(c:ConfigPonto,comando:'login'|'get_about'|'logout',body:object,session?:string):Promise<any>{
 validarConfigPonto(c)
 if(!c.ip||!c.usuario||!c.senha)throw new Error('Preencha e salve IP, usuário e senha do aparelho.')
 return new Promise((resolve,reject)=>{
  const payload=JSON.stringify(body)
  const req=(c.protocolo==='https'?https:http).request({hostname:c.ip,port:c.porta,path:`/${comando}.fcgi`+(session?'?session='+encodeURIComponent(session):''),method:'POST',rejectUnauthorized:!c.certificado_local,headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}},res=>{
   const chunks:Buffer[]=[];let size=0
   res.on('data',(b:Buffer)=>{size+=b.length;if(size>1024*1024)req.destroy(new Error('Resposta do aparelho excede o limite.'));else chunks.push(b)})
   res.on('error',()=>reject(new Error('A conexão com o aparelho foi interrompida.')))
   res.on('end',()=>{if(res.statusCode!==200){reject(new Error('O aparelho recusou a solicitação. Confira usuário, senha e porta.'));return}try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(new Error('Resposta incompatível com a API iDClass.'))}})
  })
  const timer=setTimeout(()=>req.destroy(new Error('Tempo esgotado ao conectar ao aparelho.')),10000)
  req.on('close',()=>clearTimeout(timer))
  req.on('error',()=>reject(new Error('Não foi possível conectar. Confira IP, porta, certificado e acesso à rede do aparelho.')))
  req.end(payload)
 })
}
export async function testarControlId(c:ConfigPonto){
 const login=await requisicaoControlId(c,'login',{login:c.usuario,password:c.senha})
 if(typeof login?.session!=='string'||!login.session)throw new Error('Login recusado pelo aparelho. Confira as credenciais.')
 try{const info=await requisicaoControlId(c,'get_about',{},login.session);if(!info?.nSerie)throw new Error('O aparelho não retornou a identificação esperada do iDClass.');return {serie:String(info.nSerie).slice(0,100),firmware:String(info.versionFW??'').slice(0,50)}}
 finally{await requisicaoControlId(c,'logout',{},login.session).catch(()=>undefined)}
}
