import {jsPDF} from 'jspdf'
import {validarConviteImpressao} from './convite-impressao'
import {dataDocumento} from './impressao-documento'
import {formatCPF} from './utils'

export function gerarConvitePDF(convite:any,qr:string,formato:'a4'|'80mm'='a4'){
 validarConviteImpressao(convite)
 if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(qr))throw Error('Imagem QR inválida')
 if(formato==='80mm')return gerarTermico(convite,qr)
 const pdf=new jsPDF({unit:'mm',format:'a4'})
 let y=28
 pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text('CONVITE DE VISITA',105,y,{align:'center'});y+=15
 pdf.setFont('helvetica','normal');pdf.setFontSize(11)
 const linha=(texto:string)=>{
  const linhas=pdf.splitTextToSize(texto,165)
  if(y+linhas.length*6>260){pdf.addPage();y=22}
  pdf.text(linhas,22,y);y+=linhas.length*6+4
 }
 linha('Convidado: '+(convite.convidado_nome||'Não informado'))
 linha('CPF: '+formatCPF(convite.convidado_cpf))
 linha('Associado responsável: '+(convite.associado?.nome||'Não informado'))
 linha('Título: '+(convite.associado?.numero_titulo||'Não informado'))
 linha('Data da visita: '+dataDocumento(convite.data_validade))
 if(y+55>260){pdf.addPage();y=22}
 pdf.addImage(qr,'PNG',82.5,y,45,45);y+=53
 linha(convite.qr_code)
 linha('Use o mesmo QR na entrada do clube, no exame médico e na piscina. Piscina somente após exame Apto no dia da visita. Apresente este convite e um documento com foto na portaria. Válido somente na data indicada, sujeito à conferência na entrada.')
 return pdf
}

function gerarTermico(convite:any,qr:string){
 const medida=new jsPDF({unit:'mm',format:[80,200]});medida.setFontSize(9)
 const linhas=(texto:string):string[]=>medida.splitTextToSize(texto,70)
 const dados=[
  'Convidado: '+(convite.convidado_nome||'Não informado'),
  'CPF: '+formatCPF(convite.convidado_cpf),
  'Associado responsável: '+(convite.associado?.nome||'Não informado'),
  'Título: '+(convite.associado?.numero_titulo||'Não informado'),
  'Data da visita: '+dataDocumento(convite.data_validade)
 ].map(linhas)
 const rodape=[convite.qr_code,'Use o mesmo QR na entrada do clube, no exame médico e na piscina. Piscina somente após exame Apto no dia da visita. Apresente este convite e um documento com foto na portaria. Válido somente na data indicada, sujeito à conferência na entrada.'].map(linhas)
 const altura=Math.max(110,18+dados.reduce((s,l)=>s+l.length*4.5+3,0)+48+rodape.reduce((s,l)=>s+l.length*4.5+3,0)+8)
 const pdf=new jsPDF({unit:'mm',format:[80,altura],orientation:'portrait'})
 pdf.setFont('helvetica','bold');pdf.setFontSize(12);pdf.text('CONVITE DE VISITA',40,12,{align:'center'})
 pdf.setFont('helvetica','normal');pdf.setFontSize(9)
 let y=20
 for(const l of dados){pdf.text(l,5,y,{lineHeightFactor:1.4});y+=l.length*4.5+3}
 pdf.addImage(qr,'PNG',20,y,40,40);y+=48
 for(const l of rodape){pdf.text(l,5,y,{lineHeightFactor:1.4});y+=l.length*4.5+3}
 return pdf
}
