import {randomBytes} from 'node:crypto'
import nodemailer from 'nodemailer'
import {appDb, hashSenha} from './associado-app'

/** Nunca retorna nem registra a senha temporária. */
export async function enviarAcessoAssociado(db:ReturnType<typeof appDb>, associado:{id:string,email:string}) {
  if (!process.env.APP_SMTP_HOST || !process.env.APP_SMTP_FROM) throw Error('O envio de e-mail ainda não foi configurado pelo clube.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(associado.email)) throw Error('Atualize o e-mail no cadastro do associado.')
  const url = new URL('/associado', process.env.APP_PUBLIC_URL || 'https://app.intellia.ia.br').href
  const senha = randomBytes(12).toString('base64url')
  const hash = await hashSenha(senha)
  const {error} = await db.from('associado_app_acessos').upsert({associado_id:associado.id,temporaria_hash:hash,temporaria_validade:new Date(Date.now()+3600000).toISOString()},{onConflict:'associado_id'})
  if(error) throw Error('Não foi possível preparar o acesso.')
  const mail = nodemailer.createTransport({host:process.env.APP_SMTP_HOST,port:Number(process.env.APP_SMTP_PORT||587),secure:process.env.APP_SMTP_SECURE==='true',requireTLS:process.env.APP_SMTP_SECURE!=='true',auth:process.env.APP_SMTP_USER?{user:process.env.APP_SMTP_USER,pass:process.env.APP_SMTP_PASSWORD}:undefined,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000})
  try {
    const result = await mail.sendMail({from:process.env.APP_SMTP_FROM,to:associado.email,subject:'Seu acesso ao aplicativo do associado',text:`O clube preparou seu acesso ao aplicativo.\n\nSenha temporária: ${senha}\n\nEntre com seu CPF e esta senha em ${url}\nEla vale por uma hora e deverá ser trocada antes de acessar seus dados.\n\nSua senha atual continua válida até concluir a troca. Se não reconhecer este envio, procure a secretaria.`})
    if (!result.accepted?.length) throw Error('Destinatário recusado')
  } catch {
    // Não apagar uma senha mais recente caso outra solicitação tenha ocorrido.
    await db.from('associado_app_acessos').update({temporaria_hash:null,temporaria_validade:null}).eq('associado_id',associado.id).eq('temporaria_hash',hash)
    throw Error('Não foi possível enviar o e-mail. Confira a configuração de envio e tente novamente.')
  } finally { mail.close() }
}
