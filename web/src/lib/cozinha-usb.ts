export type ConfigUSB = {nome:string;papel:58|80}
export const padraoUSB:ConfigUSB={nome:'Impressora USB da cozinha',papel:80}
export function lerCozinhaUSB():ConfigUSB {
 try{const d=JSON.parse(localStorage.getItem('cozinha-usb-v1')||'null');return {nome:typeof d?.nome==='string'?d.nome.slice(0,60):padraoUSB.nome,papel:d?.papel===58?58:80}}catch{return {...padraoUSB}}
}
export function salvarCozinhaUSB(d:ConfigUSB){localStorage.setItem('cozinha-usb-v1',JSON.stringify({nome:d.nome.trim().slice(0,60)||padraoUSB.nome,papel:d.papel===58?58:80}))}
