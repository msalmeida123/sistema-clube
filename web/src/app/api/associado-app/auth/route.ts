import {senhaLegada} from '@/lib/senhas-associado'
import {consume} from '../../../../../operacao/login-rate.cjs'
import {ErroPublicoPortal,falhaPortal} from '@/lib/portal-servidor'
import {NextRequest,NextResponse} from 'next/server'
import {randomBytes} from 'node:crypto'
import {enviarAcessoAssociado} from '@/lib/enviar-acesso-associado'
import {appDb,cpfSchema,hashSenha,confereSenha,digest,COOKIE_ASSOCIADO,sessaoAssociado,origemValida} from '@/lib/associado-app'
export const dynamic='force-dynamic'
export const runtime='nodejs'
export async function POST(req:NextRequest){
 if(!origemValida(req))return NextResponse.json({error:'Origem não permitida'},{status:403});
 try{
 const b=await req.json();if(!b||typeof b!=='object')throw new ErroPublicoPortal('DADOS');const db=appDb();
 if(b.acao==='sair'){const token=req.cookies.get(COOKIE_ASSOCIADO)?.value;if(token)await db.from('associado_app_sessoes').delete().eq('token_hash',digest(token));const r=NextResponse.json({ok:true});r.cookies.set(COOKIE_ASSOCIADO,'',{path:'/',maxAge:0});return r;}
 if(b.acao==='senha'){
  const a=await sessaoAssociado(req,true);if(!a)return NextResponse.json({error:'Entre novamente'},{status:401});
  if(typeof b.senha!=='string'||b.senha.length<10||b.senha.length>128)throw new ErroPublicoPortal('SENHA_TAMANHO');
  if(!a.sessao.trocar_senha)throw new ErroPublicoPortal('REDEFINIR');
  const {data,error}=await db.rpc('app_associado_trocar_senha',{p_token:a.tokenHash,p_hash:await hashSenha(b.senha)});if(error||!data)throw Error('Não foi possível salvar a senha.');return NextResponse.json({ok:true});
 }
 const validacao=cpfSchema.safeParse(b.cpf);if(!validacao.success)throw new ErroPublicoPortal('CPF');const cpf=validacao.data;const rate=await consume(b.acao==='enviar'?'associado-acesso':'associado',cpf,b.acao==='enviar'?5:20);if(!rate.allowed)return NextResponse.json({error:'Muitas tentativas. Aguarde alguns minutos e tente novamente.',code:'LIMITE'},{status:429,headers:{'Retry-After':String(rate.retryAfter),'Cache-Control':'no-store'}});
 const {data:encontrados,error:buscaErro}=await db.rpc('app_associado_por_cpf',{p_cpf:cpf});if(buscaErro)throw buscaErro;
 const a=encontrados?.length===1?encontrados[0]:null;
 if(b.acao==='enviar'){
  if(!process.env.APP_SMTP_HOST)throw Error('O envio de e-mail ainda não foi configurado pelo clube.');
  if(a?.email){
   await enviarAcessoAssociado(db,a);
  }
  return NextResponse.json({ok:true,message:'Se o CPF possuir cadastro e e-mail, enviaremos uma senha temporária. Confira sua caixa de entrada.'});
 }
 if(b.acao!=='entrar'||typeof b.senha!=='string'||b.senha.length>128)throw Error('Informe CPF e senha.');
 const {data:acesso,error:acessoErro}=a?await db.from('associado_app_acessos').select('senha_hash,temporaria_hash,temporaria_validade').eq('associado_id',a.id).maybeSingle():{data:null,error:null};if(acessoErro)throw acessoErro;
 const regular=await confereSenha(b.senha,acesso?.senha_hash);const temp=!regular&&acesso?.temporaria_validade>new Date().toISOString()&&await confereSenha(b.senha,acesso?.temporaria_hash);
 if(!a||!regular&&!temp)return NextResponse.json({error:'CPF ou senha inválidos.',code:'CREDENCIAIS'},{status:401});
 // Compare-and-swap prevents a simultaneous password reset from being overwritten.
 const campo=regular?'senha_hash':'temporaria_hash';const anterior=acesso?.[campo];
 if(senhaLegada(anterior)){
  const novo=await hashSenha(b.senha);
  const {data:migrado,error:migracaoErro}=await db.from('associado_app_acessos').update({[campo]:novo}).eq('associado_id',a.id).eq(campo,anterior).select('associado_id').maybeSingle();
  if(migracaoErro)throw migracaoErro;
  if(!migrado)return NextResponse.json({error:'Entre novamente com sua senha atual.',code:'CREDENCIAIS'},{status:401});
 }
 const token=randomBytes(32).toString('base64url');const {error}=await db.from('associado_app_sessoes').insert({token_hash:digest(token),associado_id:a.id,trocar_senha:!!temp,expira_em:new Date(Date.now()+(temp?3600000:7*86400000)).toISOString()});if(error)throw error;
 const r=NextResponse.json({ok:true,trocar_senha:!!temp});r.cookies.set(COOKIE_ASSOCIADO,token,{httpOnly:true,sameSite:'lax',secure:req.nextUrl.protocol==='https:'||process.env.APP_PUBLIC_URL?.startsWith('https:'),path:'/',maxAge:temp?3600:7*86400});return r;
 }catch(e){return falhaPortal('autenticacao',e)}
}
