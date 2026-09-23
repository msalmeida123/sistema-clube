import {falhaPortal} from '@/lib/portal-servidor'
import {NextRequest,NextResponse} from 'next/server'
import {sessaoAssociado,origemValida,relatoSchema,limite} from '@/lib/associado-app'
import {codigoCarteirinha} from '@/lib/carteirinha-qr'
import QRCode from 'qrcode'
export const dynamic='force-dynamic'
export const runtime='nodejs'
export async function GET(req:NextRequest){
 try{
 const a=await sessaoAssociado(req,true);if(!a)return NextResponse.json({error:'Entre com seu CPF e senha.'},{status:401});
 if(a.sessao.trocar_senha)return NextResponse.json({trocar_senha:true},{headers:{'Cache-Control':'no-store'}});
 const page=Math.max(0,Math.min(10000,Number(req.nextUrl.searchParams.get('pagina'))||0));const id=a.associado.id;
 const [m,e,r]=await Promise.all([
 a.db.from('mensalidades').select('id,referencia,mes_referencia,tipo,valor,valor_pago,status,data_vencimento,data_pagamento',{count:'exact'}).eq('associado_id',id).order('data_vencimento',{ascending:false}).order('id').range(page*30,page*30+29),
 a.db.from('exames_medicos').select('id,tipo_exame,data_exame,data_validade,resultado,status,medico_nome,medico').is('dependente_id',null).or(`associado_id.eq.${id},and(pessoa_id.eq.${id},tipo_pessoa.eq.associado)`).order('data_exame',{ascending:false}).limit(30),
 a.db.from('associado_app_relatos').select('id,assunto,descricao,local,data_ocorrencia,status,resposta,criado_em').eq('associado_id',id).order('criado_em',{ascending:false}).limit(100)
 ]);if(m.error||e.error||r.error)throw m.error||e.error||r.error;
 const code=codigoCarteirinha(id,a.associado.qr_code);const qr=await QRCode.toDataURL(code,{width:280,margin:4,errorCorrectionLevel:'M'});
 return NextResponse.json({associado:{nome:a.associado.nome,numero_titulo:a.associado.numero_titulo,status:a.associado.status},qr,mensalidades:m.data,total_mensalidades:m.count,pagina:page,exames:e.data,relatos:r.data},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return falhaPortal('carregar-portal',e)}
}
export async function POST(req:NextRequest){
 if(!origemValida(req))return NextResponse.json({error:'Origem não permitida'},{status:403});
 try{
 const a=await sessaoAssociado(req);if(!a)return NextResponse.json({error:'Entre novamente e conclua a troca de senha.'},{status:401});
 await limite(a.db,'relato:'+a.associado.id,10);const b=relatoSchema.parse(await req.json());
 const {data:existing}=await a.db.from('associado_app_relatos').select('id').eq('id',b.id).eq('associado_id',a.associado.id).maybeSingle();if(existing)return NextResponse.json({id:existing.id});
 const {error}=await a.db.from('associado_app_relatos').insert({...b,associado_id:a.associado.id});if(error)throw error;return NextResponse.json({id:b.id});
 }catch(e){return falhaPortal('enviar-relato',e)}
}
