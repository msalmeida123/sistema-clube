'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Printer } from 'lucide-react'

export default function ContratoPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const contratoRef = useRef<HTMLDivElement>(null)
  
  const [associado, setAssociado] = useState<any>(null)
  const [planoValor, setPlanoValor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: assocData } = await supabase
        .from('associados')
        .select('*')
        .eq('id', params.id)
        .single()

      if (assocData) {
        const { data: planoData } = await supabase
          .from('planos_valores')
          .select('*')
          .eq('tipo', assocData.plano)
          .eq('ativo', true)
          .single()
        setPlanoValor(planoData)
      }

      setAssociado(assocData)
      setLoading(false)
    }

    if (params.id) fetchData()
  }, [params.id, supabase])

  const imprimir = () => window.print()

  const gerarPDF = async () => {
    if (!contratoRef.current) return
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default
    
    const canvas = await html2canvas(contratoRef.current, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    
    pdf.addImage(imgData, 'PNG', (pdfWidth - imgWidth * ratio) / 2, 5, imgWidth * ratio, imgHeight * ratio)
    pdf.save(`contrato_${associado?.nome?.replace(/\s+/g, '_')}.pdf`)
  }

  const formatarData = (data: string | null) => data ? new Date(data).toLocaleDateString('pt-BR') : '-'
  const formatarMoeda = (valor: number | null) => valor ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
  
  const dataExtenso = () => {
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    const hoje = new Date()
    return `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`
  }

  const categoriaDescricao: Record<string, string> = {
    individual: 'EFETIVO - Associado sujeito ao pagamento de mensalidades, com direito de uso das dependências sociais',
    familiar: 'PATRIMONIAL EFETIVO - Associado portador de título patrimonial com direito à frequência nas instalações sociais, urbana e campestre',
    patrimonial: 'PATRIMONIAL EFETIVO - Associado portador de título patrimonial com direito à frequência nas instalações sociais, direito a voto e participação em Assembleias Gerais',
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p>Carregando...</p></div>
  if (!associado) return <div className="flex flex-col items-center justify-center h-64 gap-4"><p>Associado não encontrado</p><Button onClick={() => router.back()}>Voltar</Button></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-bold">Contrato de Associação</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={imprimir}><Printer className="h-4 w-4 mr-2" />Imprimir</Button>
          <Button onClick={gerarPDF}><Download className="h-4 w-4 mr-2" />Baixar PDF</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto print:shadow-none">
        <div ref={contratoRef} className="space-y-5 text-sm leading-relaxed text-gray-800">
          
          {/* Cabeçalho */}
          <div className="text-center border-b-2 border-gray-800 pb-4">
            <h1 className="text-2xl font-bold uppercase">ASSOCIAÇÃO DOS EMPREGADOS NO COMÉRCIO DE FRANCA</h1>
            <p className="text-lg font-semibold">A E C</p>
            <p className="text-sm text-gray-600">CNPJ: 47.987.136/0001-09</p>
            <p className="text-sm text-gray-600">Avenida Miguel Sábio de Mello, nº 351 - Franca/SP</p>
            <p className="text-xs text-gray-500 mt-1">Fundada em 13 de maio de 1909 - Utilidade Pública Lei Estadual nº 821/1950</p>
          </div>

          {/* Título */}
          <div className="text-center py-3">
            <h2 className="text-xl font-bold uppercase">TERMO DE ADMISSÃO E COMPROMISSO</h2>
            <p className="text-sm text-gray-600">Nº {associado.numero_titulo?.toString().padStart(5, '0')}/{new Date().getFullYear()}</p>
          </div>

          {/* Preâmbulo */}
          <p className="text-justify">
            Pelo presente instrumento particular, de um lado a <strong>ASSOCIAÇÃO DOS EMPREGADOS NO COMÉRCIO DE FRANCA - AEC</strong>, 
            pessoa jurídica de direito privado, sem fins lucrativos, inscrita no CNPJ sob o nº <strong>47.987.136/0001-09</strong>, 
            com sede na Avenida Miguel Sábio de Mello, nº 351, cidade de Franca, Estado de São Paulo, 
            reconhecida de utilidade pública pela Lei Estadual nº 821 de 14 de novembro de 1950, 
            neste ato representada por seu Presidente, doravante denominada simplesmente <strong>AEC</strong>, 
            e de outro lado:
          </p>

          {/* Dados do Associado */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="font-bold mb-3 text-center uppercase">QUALIFICAÇÃO DO PROPONENTE</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-semibold">Nome:</span> {associado.nome}</div>
              <div><span className="font-semibold">CPF:</span> {associado.cpf}</div>
              <div><span className="font-semibold">RG:</span> {associado.rg || '-'}</div>
              <div><span className="font-semibold">Nascimento:</span> {formatarData(associado.data_nascimento)}</div>
              <div><span className="font-semibold">Telefone:</span> {associado.telefone || '-'}</div>
              <div><span className="font-semibold">E-mail:</span> {associado.email || '-'}</div>
              <div className="col-span-2"><span className="font-semibold">Endereço:</span> {associado.endereco}, {associado.numero}{associado.complemento && ` - ${associado.complemento}`}, {associado.bairro} - {associado.cidade}/{associado.estado} - CEP: {associado.cep}</div>
            </div>
          </div>

          <p className="text-justify">
            Doravante denominado simplesmente <strong>ASSOCIADO</strong>, têm entre si justo e acordado o seguinte, 
            nos termos do Estatuto Social registrado em cartório:
          </p>

          {/* Cláusulas baseadas no Estatuto */}
          <div className="space-y-4">
            
            <div>
              <h3 className="font-bold">CLÁUSULA PRIMEIRA - DA ADMISSÃO (Art. 21 do Estatuto)</h3>
              <p className="text-justify mt-2">
                O ASSOCIADO solicita sua admissão ao quadro social da AEC, na categoria <strong>{associado.plano?.toUpperCase()}</strong>, 
                declarando estar ciente de que a proposta será encaminhada à Comissão de Sindicância, que dará parecer 
                da conveniência ou não da admissão, após o que será discutida e votada pela Diretoria, conforme Art. 21, §2º do Estatuto.
              </p>
              <p className="text-justify mt-2 italic text-gray-600 text-xs">
                {categoriaDescricao[associado.plano] || ''}
              </p>
            </div>

            <div>
              <h3 className="font-bold">CLÁUSULA SEGUNDA - DAS CONTRIBUIÇÕES (Arts. 27 e 130 do Estatuto)</h3>
              <p className="text-justify mt-2">
                O ASSOCIADO compromete-se a pagar a contribuição mensal de <strong>{formatarMoeda(planoValor?.valor_mensal)}</strong>, 
                até o dia 10 (dez) de cada mês, conforme fixado pela Diretoria e referendado pelo Conselho Deliberativo (Art. 27).
              </p>
              <p className="text-justify mt-2">
                <strong>§1º</strong> - Na ocorrência de atraso, serão cobrados juros e correção monetária na forma vigente no mercado financeiro (Art. 130, §2º).
              </p>
              <p className="text-justify mt-2">
                <strong>§2º</strong> - A taxa de dependente será de até 1/10 (um décimo) da mensalidade, multiplicada pelo número de dependentes, 
                excluindo-se apenas o cônjuge (Art. 130, §3º).
              </p>
            </div>

            <div>
              <h3 className="font-bold">CLÁUSULA TERCEIRA - DOS DIREITOS (Art. 24 do Estatuto)</h3>
              <p className="text-justify mt-2">São direitos do ASSOCIADO em pleno gozo de seus direitos estatutários:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>Frequentar a sociedade e suas dependências com familiares e dependentes, tomando parte nas atividades esportivas e sociais;</li>
                <li>Apresentar convidados à visitação nos dias comuns, mediante assinatura de termo de responsabilidade;</li>
                <li>Tomar parte nas Assembleias Gerais, discutindo e oferecendo propostas;</li>
                <li>Solicitar convocação do Conselho Deliberativo mediante requerimento de 1/5 dos associados efetivos;</li>
                <li>Recorrer ao Conselho Deliberativo de qualquer penalidade, no prazo de 15 (quinze) dias;</li>
                <li>Integrar a Diretoria ou qualquer comissão quando eleito ou nomeado;</li>
                <li>Sugerir à Diretoria, por escrito, medidas proveitosas à Sociedade;</li>
                <li>Propor admissão de novos associados;</li>
                <li>Apresentar defesa por escrito, à Diretoria, no prazo de 15 dias, sobre qualquer penalidade.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold">CLÁUSULA QUARTA - DOS DEVERES (Art. 25 do Estatuto)</h3>
              <p className="text-justify mt-2">São deveres do ASSOCIADO:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>Cumprir as disposições do Estatuto, as deliberações da Assembleia Geral, Conselho Deliberativo e Diretoria;</li>
                <li>Contribuir para que a entidade realize suas finalidades e concorrer para o seu engrandecimento;</li>
                <li>Pagar pontualmente suas mensalidades, taxas adicionais, quando devidas, ou qualquer outro compromisso;</li>
                <li>Desempenhar, com zelo e dedicação, os cargos que lhe forem confiados;</li>
                <li>Portar-se com correção, sempre que estiver em causa suas condições de associado;</li>
                <li>Evitar, dentro da sede social e campestre, qualquer manifestação de caráter político ou religioso;</li>
                <li>Respeitar e cumprir as determinações do Presidente e da Diretoria;</li>
                <li>Acatar os membros da diretoria e empregados da entidade no exercício de suas atribuições;</li>
                <li>Apresentar a carteira de identidade social, acompanhada do recibo do mês, quando solicitado;</li>
                <li>Comunicar à Secretaria, por escrito, mudanças de endereços, profissão, estado civil;</li>
                <li>Zelar pela conservação do patrimônio, indenizando prejuízos causados por sua culpa ou de sua família.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold">CLÁUSULA QUINTA - DAS PENALIDADES (Arts. 28 a 34 do Estatuto)</h3>
              <p className="text-justify mt-2">
                O ASSOCIADO que infringir o Estatuto, desacatar decisões da Diretoria, desrespeitar diretores e comissões, 
                promover desordens, atrasar mais de 03 (três) meses o pagamento de mensalidades, ou der prova de não ser digno 
                de fazer parte do quadro social, ficará sujeito às seguintes penalidades:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li><strong>Admoestação</strong> - por escrito, para faltas de pequena gravidade (Art. 30);</li>
                <li><strong>Suspensão</strong> - de até 119 dias, conforme gravidade da falta (Art. 31). O suspenso paga mensalidades mas não tem ingresso nas dependências (Art. 32);</li>
                <li><strong>Eliminação</strong> - para atrasos de mensalidades por 3 meses sem quitação em 15 dias, não satisfazer compromissos, admissão por informações falsas, caluniar membros diretivos, provocar conflitos, entre outros (Art. 33);</li>
                <li><strong>Expulsão</strong> - para condenação judicial por causa desonrosa, apropriação de valores da entidade, atos atentatórios à moral e bons costumes (Art. 34).</li>
              </ul>
              <p className="text-justify mt-2 text-sm">
                <strong>§ Único</strong> - Cabe à Diretoria o julgamento e aplicação das penalidades (Art. 29), 
                assegurado ao ASSOCIADO o direito de recurso ao Conselho Deliberativo no prazo de 15 dias (Art. 39).
              </p>
            </div>

            <div>
              <h3 className="font-bold">CLÁUSULA SEXTA - DA ELIMINAÇÃO POR INADIMPLÊNCIA (Art. 131 do Estatuto)</h3>
              <p className="text-justify mt-2">
                Será eliminado o ASSOCIADO que atrasar no pagamento de suas contribuições por mais de 03 (três) meses consecutivos.
              </p>
              <p className="text-justify mt-2">
                <strong>§1º</strong> - A juízo da Diretoria, mediante recolhimento de taxa de expediente e das contribuições em atraso 
                devidamente corrigidas pela taxa financeira vigente, o associado poderá ser readmitido, se manifestar sua intenção 
                em até noventa dias a contar de sua eliminação.
              </p>
              <p className="text-justify mt-2">
                <strong>§2º</strong> - Ultrapassado o prazo deste artigo, o associado somente poderá ser readmitido mediante 
                aquisição de novo título patrimonial, pelo preço vigente.
              </p>
            </div>

            <div>
              <h3 className="font-bold">CLÁUSULA SÉTIMA - DA FAMÍLIA DO ASSOCIADO (Art. 20 do Estatuto)</h3>
              <p className="text-justify mt-2">Para efeitos estatutários, a família do associado será constituída pelas seguintes pessoas:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>Cônjuge;</li>
                <li>Filhos menores de 21 (vinte e um) anos;</li>
                <li>Filhos universitários até 24 (vinte e quatro) anos, com declaração da Universidade;</li>
                <li>Pai e mãe, com idade superior a 60 anos, quando vivam sob dependência econômica do associado solteiro;</li>
                <li>Mãe e sogra, quando viúvas e vivam sob dependência econômica do associado;</li>
                <li>Filhos legalmente adotados, menores de 21 anos, que vivam sob dependência econômica;</li>
                <li>Enteados, até idade de 21 (vinte e um) anos.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold">CLÁUSULA OITAVA - DISPOSIÇÕES GERAIS</h3>
              <p className="text-justify mt-2">
                O ASSOCIADO declara ter lido e estar de acordo com o Estatuto Social da AEC, comprometendo-se a cumpri-lo 
                integralmente, bem como os Regulamentos e Regimento Interno aprovados pelo Conselho Deliberativo.
              </p>
              <p className="text-justify mt-2">
                <strong>§1º</strong> - Os associados não respondem solidária ou subsidiariamente pelas obrigações contraídas pela entidade (Art. 135).
              </p>
              <p className="text-justify mt-2">
                <strong>§2º</strong> - A entidade deverá manter-se estranha a qualquer manifestação de caráter partidário, político ou religioso (Art. 140).
              </p>
            </div>

            <div>
              <h3 className="font-bold">CLÁUSULA NONA - DO FORO</h3>
              <p className="text-justify mt-2">
                Fica eleito o Foro da Comarca de <strong>Franca/SP</strong> para dirimir quaisquer questões oriundas do presente termo, 
                com renúncia expressa de qualquer outro, por mais privilegiado que seja.
              </p>
            </div>
          </div>

          {/* Declaração Final */}
          <div className="text-center mt-6 pt-4 border-t">
            <p className="text-justify">
              E por estarem assim justos e acordados, o PROPONENTE declara expressamente que recebeu cópia do Estatuto Social 
              e que aceita todas as condições nele estabelecidas, firmando o presente termo em 02 (duas) vias de igual 
              teor e forma, na presença de 02 (duas) testemunhas.
            </p>
            <p className="mt-4 font-medium">Franca/SP, {dataExtenso()}.</p>
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-2 gap-8 mt-10">
            <div className="text-center">
              <div className="border-t border-gray-800 pt-2 mx-4">
                <p className="font-bold">ASSOCIAÇÃO DOS EMPREGADOS NO COMÉRCIO DE FRANCA</p>
                <p className="text-sm">Presidente da Diretoria</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-800 pt-2 mx-4">
                <p className="font-bold">{associado.nome}</p>
                <p className="text-sm">Proponente/Associado</p>
              </div>
            </div>
          </div>

          {/* Testemunhas */}
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="text-center">
              <div className="border-t border-gray-800 pt-2 mx-8">
                <p className="text-sm font-medium">Testemunha 1</p>
                <p className="text-xs text-gray-500">Nome: _______________________</p>
                <p className="text-xs text-gray-500">CPF: _______________________</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-800 pt-2 mx-8">
                <p className="text-sm font-medium">Testemunha 2</p>
                <p className="text-xs text-gray-500">Nome: _______________________</p>
                <p className="text-xs text-gray-500">CPF: _______________________</p>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-center mt-6 pt-4 border-t text-xs text-gray-500">
            <p>Documento gerado eletronicamente pelo Sistema de Gestão da AEC</p>
            <p>Este termo está em conformidade com o Estatuto Social registrado sob nº 65676 no 1º Oficial de Registro Civil de Franca/SP</p>
          </div>

        </div>
      </div>
    </div>
  )
}
