import {NextRequest,NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'
import {verificarAssinaturaStripe,confirmarFaturaStripe,stripeAPI} from '@/lib/stripe-licenca'
export const runtime='nodejs'
export async function POST(req:NextRequest){
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})
 const {data:c,error}=await db.from('licenca_integracoes').select('stripe_secret,stripe_webhook,stripe_price').eq('id',true).single();if(error||!c?.stripe_secret||!c.stripe_webhook)return NextResponse.json({error:'Integração indisponível'},{status:503})
 const raw=await req.text();if(Buffer.byteLength(raw)>1000000)return new Response(null,{status:413});let evento;try{evento=verificarAssinaturaStripe(raw,req.headers.get('stripe-signature')||'',c.stripe_webhook)}catch{return NextResponse.json({error:'Assinatura inválida'},{status:400})}
 try{if(evento.type==='invoice.paid')await confirmarFaturaStripe(db,c,evento.data.object.id);else if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(evento.type)){const session=await stripeAPI(c.stripe_secret,'checkout/sessions/'+encodeURIComponent(evento.data.object.id));const sub=typeof session.subscription==='string'?session.subscription:session.subscription?.id;if(sub){const s=await stripeAPI(c.stripe_secret,'subscriptions/'+encodeURIComponent(sub));const invoice=typeof s.latest_invoice==='string'?s.latest_invoice:s.latest_invoice?.id;if(invoice)await confirmarFaturaStripe(db,c,invoice)}}return NextResponse.json({received:true})}catch{return NextResponse.json({error:'Não foi possível processar a confirmação. O Stripe pode reenviar o evento.'},{status:500})}
}
