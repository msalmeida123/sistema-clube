import {isIP,Socket} from 'node:net'

export function validarImpressoraRH(valor:any){
 const nome=typeof valor?.nome==='string'?valor.nome.trim():''
 const ip=typeof valor?.ip==='string'?valor.ip.trim():''
 const partes=ip.split('.').map(Number)
 const privado=isIP(ip)===4&&(partes[0]===10||(partes[0]===172&&partes[1]>=16&&partes[1]<=31)||(partes[0]===192&&partes[1]===168))
 if(!nome||nome.length>100)throw Error('Informe o nome da impressora (até 100 caracteres).')
 if(!privado)throw Error('Informe o IPv4 da impressora na rede local, como 192.168.1.150.')
 if(!Number.isInteger(valor.porta)||![515,631,9100,9101,9102,9103,9104,9105,9106,9107,9108,9109].includes(valor.porta))throw Error('Use uma porta de impressão: 515, 631 ou 9100 a 9109.')
 return {nome,ip,porta:valor.porta as number}
}

// Verifica somente a conexão TCP; não envia documentos nem comandos ao equipamento.
export function testarImpressoraRH(valor:unknown):Promise<void>{
 const config=validarImpressoraRH(valor)
 return new Promise((resolve,reject)=>{
  const socket=new Socket()
  let concluido=false
  const fim=(erro?:Error)=>{if(concluido)return;concluido=true;clearTimeout(prazo);socket.destroy();erro?reject(erro):resolve()}
  const prazo=setTimeout(()=>fim(Error('Tempo esgotado. Confira o IP, a porta e o acesso do servidor à rede da impressora.')),5000)
  socket.once('error',()=>fim(Error('Não foi possível conectar. Confira se a impressora está ligada e acessível pela rede.')))
  socket.once('close',()=>{if(!concluido)fim(Error('A conexão foi encerrada.'))})
  socket.connect(config.porta,config.ip,()=>fim())
 })
}
