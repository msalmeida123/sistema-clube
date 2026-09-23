import {z} from 'zod'
export const campos = {primaria:'Cor primária',secundaria:'Cor secundária',destaque:'Cor de destaque',cabecalho:'Cor do cabeçalho',menu:'Cor do menu lateral',textoMenu:'Cor do texto do menu',botoes:'Cor dos botões',fundo:'Cor do fundo da página',texto:'Cor do texto principal'} as const
export type Cores = Record<keyof typeof campos,string>
export const padrao:Cores={primaria:'#2459D3',secundaria:'#EFF3F8',destaque:'#2459D3',cabecalho:'#FFFFFF',menu:'#FFFFFF',textoMenu:'#334155',botoes:'#2459D3',fundo:'#F3F4F6',texto:'#111827'}
const hex=z.string().regex(/^#[0-9a-fA-F]{6}$/).transform(s=>s.toUpperCase())
export const coresSchema=z.object({primaria:hex,secundaria:hex,destaque:hex,cabecalho:hex,menu:hex,textoMenu:hex,botoes:hex,fundo:hex,texto:hex}).strict()
export const MAX_ICONE=2*1024*1024
export const tiposIcone=['image/png','image/jpeg','image/webp']
export const tamanhos=[16,32,180,192,512] as const
export function contraste(a:string,b:string){const lum=(c:string)=>{const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
export function sobre(c:string){return contraste(c,'#FFFFFF')>=contraste(c,'#000000')?'#FFFFFF':'#000000'}
export function avisos(c:Cores){return [[c.texto,'#FFFFFF','Texto principal e cartões'],[c.texto,c.fundo,'Texto principal e fundo'],[c.textoMenu,c.menu,'Texto do menu e menu'],[c.primaria,c.fundo,'Links primários e fundo'],[c.primaria,'#FFFFFF','Links primários e cartões']].filter(([a,b])=>contraste(a,b)<4.5).map(([, ,s])=>`${s}: contraste inferior a 4,5:1.`)}
function hsl(hex:string){let [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return `${h.toFixed(1)} ${(s*100).toFixed(1)}% ${(l*100).toFixed(1)}%`}
export function variaveis(c:Cores):Record<string,string>{const out:Record<string,string>={};for(const [key,color] of Object.entries(c))out[`--tema-${key}`]=color;const vars:Record<string,string>={primary:c.primaria,'primary-foreground':sobre(c.primaria),secondary:c.secundaria,'secondary-foreground':sobre(c.secundaria),accent:c.destaque,'accent-foreground':sobre(c.destaque),background:c.fundo,foreground:c.texto,ring:c.primaria,'card-foreground':sobre('#FFFFFF'),button:c.botoes,'button-foreground':sobre(c.botoes)};for(const [key,color]of Object.entries(vars))out[`--${key}`]=hsl(color);out['--tema-cabecalho-texto']=sobre(c.cabecalho);out['--tema-botoes-texto']=sobre(c.botoes);return out}
export type Tema={cores:Cores,versao:number,icone:boolean,personalizado:boolean}
export const temaPadrao:Tema={cores:padrao,versao:0,icone:false,personalizado:false}
