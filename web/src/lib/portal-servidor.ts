import {NextResponse} from 'next/server'
export class ErroPublicoPortal extends Error {
 constructor(public code:string,public status=422){super(code);Object.setPrototypeOf(this,new.target.prototype);this.name='ErroPublicoPortal'}
}
/** Somente metadados técnicos no servidor: nunca senha, cookie, CPF ou texto de mensagem. */
export function falhaPortal(operacao:string,e:unknown){
 const conhecido=e instanceof ErroPublicoPortal
 const status=conhecido?e.status:e instanceof Error&&(e.name==='ZodError'||e.name==='SyntaxError')?422:503
 const obj=e as {code?:unknown;name?:unknown}|null
 console.error('[portal]',{operacao,status,tipo:typeof obj?.name==='string'?obj.name.slice(0,60):'erro',codigo:typeof obj?.code==='string'&&/^[\w-]{1,40}$/.test(obj.code)?obj.code:'indisponivel'})
 return NextResponse.json({error:status===429?'Aguarde alguns minutos antes de tentar novamente.':status===422?'Confira os dados preenchidos.':'Serviço temporariamente indisponível.',...(conhecido?{code:e.code}:{})},{status,headers:{'Cache-Control':'no-store'}})
}
