'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  FileText, Download, Loader2, Calendar, Filter,
  Waves, DoorOpen, Dumbbell, Droplets, Ticket, Users,
  Printer, Eye
} from 'lucide-react'

export default function RelatoriosSetoresPage() {
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [previewAberto, setPreviewAberto] = useState<string | null>(null)
  const [dadosRelatorio, setDadosRelatorio] = useState<any>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    // Definir período padrão (último mês)
    const hoje = new Date()
    const inicioMes = new Date(hoje)
    inicioMes.setDate(inicioMes.getDate() - 30)
    
    setDataInicio(inicioMes.toISOString().split('T')[0])
    setDataFim(hoje.toISOString().split('T')[0])
  }, [])

  const gerarRelatorioPiscina = async (visualizar = false) => {
    setLoading(true)
    toast.loading('Gerando relatório da Piscina...')

    const inicio = new Date(dataInicio)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(23, 59, 59, 999)

    // Buscar acessos da piscina
    const { data: acessos } = await supabase
      .from('acessos_piscina')
      .select(`
        *,
        associado:associados(nome, numero_titulo, cpf),
        dependente:dependentes(nome, cpf)
      `)
      .gte('data_hora', inicio.toISOString())
      .lte('data_hora', fim.toISOString())
      .order('data_hora', { ascending: false })

    const dados = acessos || []
    
    // Estatísticas
    const totalAcessos = dados.length
    const acessosAssociados = dados.filter(a => a.associado).length
    const acessosDependentes = dados.filter(a => a.dependente).length
    
    // Acessos por dia
    const porDia: { [key: string]: number } = {}
    dados.forEach(a => {
      const data = new Date(a.data_hora).toLocaleDateString('pt-BR')
      porDia[data] = (porDia[data] || 0) + 1
    })

    // Acessos por hora
    const porHora: { [key: string]: number } = {}
    dados.forEach(a => {
      const hora = new Date(a.data_hora).getHours()
      porHora[`${hora}h`] = (porHora[`${hora}h`] || 0) + 1
    })

    // Top frequentadores
    const frequencia: { [key: string]: { nome: string; qtd: number } } = {}
    dados.forEach(a => {
      const nome = a.associado?.nome || a.dependente?.nome || 'Desconhecido'
      if (!frequencia[nome]) frequencia[nome] = { nome, qtd: 0 }
      frequencia[nome].qtd++
    })
    const topFrequentadores = Object.values(frequencia)
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 20)

    const periodo = `${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Piscina - ${periodo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1f2937; }
          .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { opacity: 0.9; }
          .info-row { display: flex; gap: 10px; margin-top: 15px; font-size: 14px; }
          .info-row span { background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; }
          .stat-value { font-size: 36px; font-weight: 700; color: #0ea5e9; }
          .stat-label { color: #64748b; font-size: 14px; margin-top: 5px; }
          h2 { color: #0ea5e9; font-size: 18px; margin: 25px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
          th { background: #0ea5e9; color: white; padding: 12px 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          tr:hover { background: #f1f5f9; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
          .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
          @media print { 
            body { padding: 15px; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏊 Relatório da Piscina</h1>
          <p>Controle de Acessos</p>
          <div class="info-row">
            <span>📅 Período: ${periodo}</span>
            <span>🕐 Gerado: ${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${totalAcessos}</div>
            <div class="stat-label">Total de Acessos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${acessosAssociados}</div>
            <div class="stat-label">Associados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${acessosDependentes}</div>
            <div class="stat-label">Dependentes</div>
          </div>
        </div>

        <div class="two-cols">
          <div>
            <h2>📊 Acessos por Dia</h2>
            <table>
              <thead><tr><th>Data</th><th>Quantidade</th></tr></thead>
              <tbody>
                ${Object.entries(porDia).slice(0, 15).map(([data, qtd]) => `
                  <tr><td>${data}</td><td><strong>${qtd}</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div>
            <h2>⏰ Acessos por Horário</h2>
            <table>
              <thead><tr><th>Horário</th><th>Quantidade</th></tr></thead>
              <tbody>
                ${Object.entries(porHora).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).map(([hora, qtd]) => `
                  <tr><td>${hora}</td><td><strong>${qtd}</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <h2>🏆 Top 20 Frequentadores</h2>
        <table>
          <thead><tr><th>#</th><th>Nome</th><th>Acessos</th></tr></thead>
          <tbody>
            ${topFrequentadores.map((f, i) => `
              <tr><td>${i + 1}</td><td>${f.nome}</td><td><strong>${f.qtd}</strong></td></tr>
            `).join('')}
          </tbody>
        </table>

        <h2>📋 Lista Completa de Acessos</h2>
        <table>
          <thead><tr><th>Data/Hora</th><th>Nome</th><th>Tipo</th><th>CPF</th></tr></thead>
          <tbody>
            ${dados.slice(0, 200).map(a => `
              <tr>
                <td>${new Date(a.data_hora).toLocaleString('pt-BR')}</td>
                <td>${a.associado?.nome || a.dependente?.nome || '-'}</td>
                <td>${a.associado ? 'Associado' : 'Dependente'}</td>
                <td>${a.associado?.cpf || a.dependente?.cpf || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${dados.length > 200 ? '<p style="color:#64748b;font-size:12px;margin-top:10px;"><em>Mostrando apenas os primeiros 200 registros de ${dados.length} total</em></p>' : ''}

        <div class="footer">
          <p><strong>Sistema Clube</strong> - Relatório gerado automaticamente</p>
          <p>${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `

    abrirRelatorio(html, visualizar)
    toast.dismiss()
    toast.success('Relatório gerado!')
    setLoading(false)
  }

  const gerarRelatorioPortaria = async (visualizar = false) => {
    setLoading(true)
    toast.loading('Gerando relatório da Portaria...')

    const inicio = new Date(dataInicio)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(23, 59, 59, 999)

    // Buscar acessos da portaria do clube
    const { data: acessos } = await supabase
      .from('registros_acesso')
      .select(`
        *,
        associado:associados(nome, numero_titulo, cpf),
        dependente:dependentes(nome, cpf)
      `)
      .gte('data_hora', inicio.toISOString())
      .lte('data_hora', fim.toISOString())
      .order('data_hora', { ascending: false })

    const dados = acessos || []
    
    // Estatísticas
    const totalAcessos = dados.length
    const entradas = dados.filter(a => a.tipo === 'entrada').length
    const saidas = dados.filter(a => a.tipo === 'saida').length
    
    // Por dia
    const porDia: { [key: string]: { entradas: number; saidas: number } } = {}
    dados.forEach(a => {
      const data = new Date(a.data_hora).toLocaleDateString('pt-BR')
      if (!porDia[data]) porDia[data] = { entradas: 0, saidas: 0 }
      if (a.tipo === 'entrada') porDia[data].entradas++
      else porDia[data].saidas++
    })

    // Por hora
    const porHora: { [key: string]: number } = {}
    dados.forEach(a => {
      const hora = new Date(a.data_hora).getHours()
      porHora[`${hora}h`] = (porHora[`${hora}h`] || 0) + 1
    })

    const periodo = `${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Portaria - ${periodo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1f2937; }
          .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { opacity: 0.9; }
          .info-row { display: flex; gap: 10px; margin-top: 15px; font-size: 14px; }
          .info-row span { background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; }
          .stat-value { font-size: 36px; font-weight: 700; color: #8b5cf6; }
          .stat-label { color: #64748b; font-size: 14px; margin-top: 5px; }
          h2 { color: #8b5cf6; font-size: 18px; margin: 25px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
          th { background: #8b5cf6; color: white; padding: 12px 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .entrada { color: #10b981; font-weight: 600; }
          .saida { color: #ef4444; font-weight: 600; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
          .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
          @media print { 
            body { padding: 15px; }
            .header, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚪 Relatório da Portaria</h1>
          <p>Controle de Entradas e Saídas</p>
          <div class="info-row">
            <span>📅 Período: ${periodo}</span>
            <span>🕐 Gerado: ${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${totalAcessos}</div>
            <div class="stat-label">Total de Registros</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#10b981">${entradas}</div>
            <div class="stat-label">Entradas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#ef4444">${saidas}</div>
            <div class="stat-label">Saídas</div>
          </div>
        </div>

        <div class="two-cols">
          <div>
            <h2>📊 Movimentação por Dia</h2>
            <table>
              <thead><tr><th>Data</th><th>Entradas</th><th>Saídas</th></tr></thead>
              <tbody>
                ${Object.entries(porDia).slice(0, 15).map(([data, v]) => `
                  <tr>
                    <td>${data}</td>
                    <td class="entrada">${v.entradas}</td>
                    <td class="saida">${v.saidas}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div>
            <h2>⏰ Movimentação por Horário</h2>
            <table>
              <thead><tr><th>Horário</th><th>Quantidade</th></tr></thead>
              <tbody>
                ${Object.entries(porHora).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).map(([hora, qtd]) => `
                  <tr><td>${hora}</td><td><strong>${qtd}</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <h2>📋 Lista Completa de Registros</h2>
        <table>
          <thead><tr><th>Data/Hora</th><th>Nome</th><th>Tipo</th><th>Movimento</th></tr></thead>
          <tbody>
            ${dados.slice(0, 200).map(a => `
              <tr>
                <td>${new Date(a.data_hora).toLocaleString('pt-BR')}</td>
                <td>${a.associado?.nome || a.dependente?.nome || '-'}</td>
                <td>${a.associado ? 'Associado' : 'Dependente'}</td>
                <td class="${a.tipo}">${a.tipo === 'entrada' ? '➡️ Entrada' : '⬅️ Saída'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${dados.length > 200 ? `<p style="color:#64748b;font-size:12px;"><em>Mostrando 200 de ${dados.length} registros</em></p>` : ''}

        <div class="footer">
          <p><strong>Sistema Clube</strong> - Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `

    abrirRelatorio(html, visualizar)
    toast.dismiss()
    toast.success('Relatório gerado!')
    setLoading(false)
  }

  const gerarRelatorioAcademia = async (visualizar = false) => {
    setLoading(true)
    toast.loading('Gerando relatório da Academia...')

    const inicio = new Date(dataInicio)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(23, 59, 59, 999)

    // Buscar acessos da academia
    const { data: acessos } = await supabase
      .from('acessos_academia')
      .select(`
        *,
        associado:associados(nome, numero_titulo, cpf)
      `)
      .gte('data_hora', inicio.toISOString())
      .lte('data_hora', fim.toISOString())
      .order('data_hora', { ascending: false })

    const dados = acessos || []
    
    // Estatísticas
    const totalAcessos = dados.length
    
    // Por dia
    const porDia: { [key: string]: number } = {}
    dados.forEach(a => {
      const data = new Date(a.data_hora).toLocaleDateString('pt-BR')
      porDia[data] = (porDia[data] || 0) + 1
    })

    // Por hora
    const porHora: { [key: string]: number } = {}
    dados.forEach(a => {
      const hora = new Date(a.data_hora).getHours()
      porHora[`${hora}h`] = (porHora[`${hora}h`] || 0) + 1
    })

    // Top frequentadores
    const frequencia: { [key: string]: { nome: string; qtd: number } } = {}
    dados.forEach(a => {
      const nome = a.associado?.nome || 'Desconhecido'
      if (!frequencia[nome]) frequencia[nome] = { nome, qtd: 0 }
      frequencia[nome].qtd++
    })
    const topFrequentadores = Object.values(frequencia)
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 20)

    const periodo = `${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Academia - ${periodo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1f2937; }
          .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { opacity: 0.9; }
          .info-row { display: flex; gap: 10px; margin-top: 15px; font-size: 14px; }
          .info-row span { background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; }
          .stat-value { font-size: 36px; font-weight: 700; color: #f97316; }
          .stat-label { color: #64748b; font-size: 14px; margin-top: 5px; }
          h2 { color: #f97316; font-size: 18px; margin: 25px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
          th { background: #f97316; color: white; padding: 12px 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
          .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
          @media print { 
            body { padding: 15px; }
            .header, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💪 Relatório da Academia</h1>
          <p>Controle de Frequência</p>
          <div class="info-row">
            <span>📅 Período: ${periodo}</span>
            <span>🕐 Gerado: ${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${totalAcessos}</div>
            <div class="stat-label">Total de Acessos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${topFrequentadores.length}</div>
            <div class="stat-label">Usuários Únicos</div>
          </div>
        </div>

        <div class="two-cols">
          <div>
            <h2>📊 Acessos por Dia</h2>
            <table>
              <thead><tr><th>Data</th><th>Quantidade</th></tr></thead>
              <tbody>
                ${Object.entries(porDia).slice(0, 15).map(([data, qtd]) => `
                  <tr><td>${data}</td><td><strong>${qtd}</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div>
            <h2>⏰ Acessos por Horário</h2>
            <table>
              <thead><tr><th>Horário</th><th>Quantidade</th></tr></thead>
              <tbody>
                ${Object.entries(porHora).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).map(([hora, qtd]) => `
                  <tr><td>${hora}</td><td><strong>${qtd}</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <h2>🏆 Top 20 Frequentadores</h2>
        <table>
          <thead><tr><th>#</th><th>Nome</th><th>Acessos</th></tr></thead>
          <tbody>
            ${topFrequentadores.map((f, i) => `
              <tr><td>${i + 1}</td><td>${f.nome}</td><td><strong>${f.qtd}</strong></td></tr>
            `).join('')}
          </tbody>
        </table>

        <h2>📋 Lista de Acessos</h2>
        <table>
          <thead><tr><th>Data/Hora</th><th>Nome</th><th>Título</th></tr></thead>
          <tbody>
            ${dados.slice(0, 200).map(a => `
              <tr>
                <td>${new Date(a.data_hora).toLocaleString('pt-BR')}</td>
                <td>${a.associado?.nome || '-'}</td>
                <td>${a.associado?.numero_titulo || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>Sistema Clube</strong> - Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `

    abrirRelatorio(html, visualizar)
    toast.dismiss()
    toast.success('Relatório gerado!')
    setLoading(false)
  }

  const gerarRelatorioSauna = async (visualizar = false) => {
    setLoading(true)
    toast.loading('Gerando relatório da Sauna...')

    const inicio = new Date(dataInicio)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(23, 59, 59, 999)

    // Buscar uso dos armários
    const { data: usos } = await supabase
      .from('uso_armarios_sauna')
      .select(`
        *,
        armario:armarios_sauna(numero),
        associado:associados(nome, cpf),
        dependente:dependentes(nome)
      `)
      .gte('data_entrada', inicio.toISOString())
      .lte('data_entrada', fim.toISOString())
      .order('data_entrada', { ascending: false })

    // Buscar multas
    const { data: multas } = await supabase
      .from('multas_sauna')
      .select(`
        *,
        associado:associados(nome)
      `)
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString())

    const dados = usos || []
    const multasList = multas || []
    
    // Estatísticas
    const totalUsos = dados.length
    const chavesPerdidas = dados.filter(u => u.chave_perdida).length
    const totalMultas = multasList.reduce((acc, m) => acc + (m.valor || 0), 0)
    
    // Por dia
    const porDia: { [key: string]: number } = {}
    dados.forEach(u => {
      const data = new Date(u.data_entrada).toLocaleDateString('pt-BR')
      porDia[data] = (porDia[data] || 0) + 1
    })

    // Armários mais usados
    const porArmario: { [key: string]: number } = {}
    dados.forEach(u => {
      const num = u.armario?.numero || 'Desconhecido'
      porArmario[num] = (porArmario[num] || 0) + 1
    })
    const topArmarios = Object.entries(porArmario)
      .map(([num, qtd]) => ({ num, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 10)

    const periodo = `${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Sauna - ${periodo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1f2937; }
          .header { background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { opacity: 0.9; }
          .info-row { display: flex; gap: 10px; margin-top: 15px; font-size: 14px; }
          .info-row span { background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; }
          .stat-value { font-size: 32px; font-weight: 700; color: #06b6d4; }
          .stat-label { color: #64748b; font-size: 14px; margin-top: 5px; }
          h2 { color: #06b6d4; font-size: 18px; margin: 25px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
          th { background: #06b6d4; color: white; padding: 12px 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .perdida { color: #ef4444; font-weight: 600; }
          .devolvida { color: #10b981; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
          .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
          @media print { 
            body { padding: 15px; }
            .header, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧖 Relatório da Sauna</h1>
          <p>Controle de Armários e Chaves</p>
          <div class="info-row">
            <span>📅 Período: ${periodo}</span>
            <span>🕐 Gerado: ${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${totalUsos}</div>
            <div class="stat-label">Total de Usos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalUsos - chavesPerdidas}</div>
            <div class="stat-label">Chaves Devolvidas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#ef4444">${chavesPerdidas}</div>
            <div class="stat-label">Chaves Perdidas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#10b981">R$ ${totalMultas.toFixed(2)}</div>
            <div class="stat-label">Total em Multas</div>
          </div>
        </div>

        <div class="two-cols">
          <div>
            <h2>📊 Uso por Dia</h2>
            <table>
              <thead><tr><th>Data</th><th>Quantidade</th></tr></thead>
              <tbody>
                ${Object.entries(porDia).slice(0, 15).map(([data, qtd]) => `
                  <tr><td>${data}</td><td><strong>${qtd}</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div>
            <h2>🔑 Armários Mais Usados</h2>
            <table>
              <thead><tr><th>Armário</th><th>Vezes</th></tr></thead>
              <tbody>
                ${topArmarios.map(a => `
                  <tr><td>Armário ${a.num}</td><td><strong>${a.qtd}</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${multasList.length > 0 ? `
          <h2>⚠️ Multas Registradas</h2>
          <table>
            <thead><tr><th>Data</th><th>Associado</th><th>Valor</th><th>Status</th></tr></thead>
            <tbody>
              ${multasList.map(m => `
                <tr>
                  <td>${new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>${m.associado?.nome || '-'}</td>
                  <td><strong>R$ ${(m.valor || 0).toFixed(2)}</strong></td>
                  <td>${m.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <h2>📋 Lista de Uso dos Armários</h2>
        <table>
          <thead><tr><th>Data/Hora</th><th>Armário</th><th>Pessoa</th><th>Status Chave</th></tr></thead>
          <tbody>
            ${dados.slice(0, 200).map(u => `
              <tr>
                <td>${new Date(u.data_entrada).toLocaleString('pt-BR')}</td>
                <td><strong>${u.armario?.numero || '-'}</strong></td>
                <td>${u.associado?.nome || u.dependente?.nome || '-'}</td>
                <td class="${u.chave_perdida ? 'perdida' : 'devolvida'}">
                  ${u.chave_perdida ? '❌ Perdida' : '✅ Devolvida'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>Sistema Clube</strong> - Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `

    abrirRelatorio(html, visualizar)
    toast.dismiss()
    toast.success('Relatório gerado!')
    setLoading(false)
  }

  const gerarRelatorioConvites = async (visualizar = false) => {
    setLoading(true)
    toast.loading('Gerando relatório de Convites...')

    const inicio = new Date(dataInicio)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(23, 59, 59, 999)

    // Buscar convites
    const { data: convites } = await supabase
      .from('convites')
      .select(`
        *,
        associado:associados(nome, numero_titulo)
      `)
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString())
      .order('created_at', { ascending: false })

    const dados = convites || []
    
    // Estatísticas
    const totalConvites = dados.length
    const usados = dados.filter(c => c.status === 'utilizado').length
    const ativos = dados.filter(c => c.status === 'ativo').length
    const expirados = dados.filter(c => c.status === 'expirado').length
    const receita = dados.reduce((acc, c) => acc + (c.valor_pago || 0), 0)
    
    // Por dia
    const porDia: { [key: string]: { vendidos: number; usados: number } } = {}
    dados.forEach(c => {
      const data = new Date(c.created_at).toLocaleDateString('pt-BR')
      if (!porDia[data]) porDia[data] = { vendidos: 0, usados: 0 }
      porDia[data].vendidos++
      if (c.status === 'utilizado') porDia[data].usados++
    })

    // Top associados que trouxeram convites
    const porAssociado: { [key: string]: { nome: string; qtd: number } } = {}
    dados.forEach(c => {
      const nome = c.associado?.nome || 'Desconhecido'
      if (!porAssociado[nome]) porAssociado[nome] = { nome, qtd: 0 }
      porAssociado[nome].qtd++
    })
    const topAssociados = Object.values(porAssociado)
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 10)

    const periodo = `${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Convites - ${periodo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1f2937; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { opacity: 0.9; }
          .info-row { display: flex; gap: 10px; margin-top: 15px; font-size: 14px; }
          .info-row span { background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; }
          .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 25px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center; }
          .stat-value { font-size: 28px; font-weight: 700; color: #10b981; }
          .stat-label { color: #64748b; font-size: 12px; margin-top: 5px; }
          h2 { color: #10b981; font-size: 18px; margin: 25px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
          th { background: #10b981; color: white; padding: 12px 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .status-ativo { color: #10b981; }
          .status-utilizado { color: #3b82f6; }
          .status-expirado { color: #f59e0b; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
          .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
          @media print { 
            body { padding: 15px; }
            .header, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎫 Relatório de Convites</h1>
          <p>Vendas e Utilização</p>
          <div class="info-row">
            <span>📅 Período: ${periodo}</span>
            <span>🕐 Gerado: ${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${totalConvites}</div>
            <div class="stat-label">Total Vendidos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#3b82f6">${usados}</div>
            <div class="stat-label">Utilizados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#10b981">${ativos}</div>
            <div class="stat-label">Ativos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#f59e0b">${expirados}</div>
            <div class="stat-label">Expirados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">R$ ${receita.toFixed(2)}</div>
            <div class="stat-label">Receita Total</div>
          </div>
        </div>

        <div class="two-cols">
          <div>
            <h2>📊 Vendas por Dia</h2>
            <table>
              <thead><tr><th>Data</th><th>Vendidos</th><th>Usados</th></tr></thead>
              <tbody>
                ${Object.entries(porDia).slice(0, 15).map(([data, v]) => `
                  <tr>
                    <td>${data}</td>
                    <td><strong>${v.vendidos}</strong></td>
                    <td>${v.usados}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div>
            <h2>🏆 Associados que mais trouxeram convidados</h2>
            <table>
              <thead><tr><th>#</th><th>Associado</th><th>Convites</th></tr></thead>
              <tbody>
                ${topAssociados.map((a, i) => `
                  <tr><td>${i + 1}</td><td>${a.nome}</td><td><strong>${a.qtd}</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <h2>📋 Lista Completa de Convites</h2>
        <table>
          <thead><tr><th>Data</th><th>Convidado</th><th>Responsável</th><th>Valor</th><th>Status</th></tr></thead>
          <tbody>
            ${dados.map(c => `
              <tr>
                <td>${new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                <td>${c.convidado_nome}</td>
                <td>${c.associado?.nome || '-'}</td>
                <td>R$ ${(c.valor_pago || 0).toFixed(2)}</td>
                <td class="status-${c.status}">${c.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>Sistema Clube</strong> - Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `

    abrirRelatorio(html, visualizar)
    toast.dismiss()
    toast.success('Relatório gerado!')
    setLoading(false)
  }

  const abrirRelatorio = (html: string, visualizar: boolean) => {
    const janela = window.open('', '_blank')
    if (janela) {
      janela.document.write(html)
      janela.document.close()
      if (!visualizar) {
        janela.onload = () => janela.print()
      }
    }
  }

  const relatorios = [
    {
      id: 'piscina',
      titulo: 'Piscina',
      descricao: 'Acessos, frequência por horário e top frequentadores',
      icon: Waves,
      cor: 'bg-blue-500',
      gerar: gerarRelatorioPiscina,
    },
    {
      id: 'portaria',
      titulo: 'Portaria',
      descricao: 'Entradas e saídas do clube, movimentação diária',
      icon: DoorOpen,
      cor: 'bg-purple-500',
      gerar: gerarRelatorioPortaria,
    },
    {
      id: 'academia',
      titulo: 'Academia',
      descricao: 'Frequência, horários de pico e ranking de usuários',
      icon: Dumbbell,
      cor: 'bg-orange-500',
      gerar: gerarRelatorioAcademia,
    },
    {
      id: 'sauna',
      titulo: 'Sauna',
      descricao: 'Uso de armários, chaves perdidas e multas',
      icon: Droplets,
      cor: 'bg-cyan-500',
      gerar: gerarRelatorioSauna,
    },
    {
      id: 'convites',
      titulo: 'Convites',
      descricao: 'Vendas, utilização e receita de convites',
      icon: Ticket,
      cor: 'bg-green-500',
      gerar: gerarRelatorioConvites,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Relatórios por Setor
        </h1>
        <p className="text-muted-foreground">Gere relatórios detalhados de cada área do clube</p>
      </div>

      {/* Filtro de Período */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="w-40"
              />
              <span className="text-gray-500">até</span>
              <Input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date()
                  setDataInicio(hoje.toISOString().split('T')[0])
                  setDataFim(hoje.toISOString().split('T')[0])
                }}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date()
                  const semana = new Date(hoje)
                  semana.setDate(semana.getDate() - 7)
                  setDataInicio(semana.toISOString().split('T')[0])
                  setDataFim(hoje.toISOString().split('T')[0])
                }}
              >
                Última Semana
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date()
                  const mes = new Date(hoje)
                  mes.setDate(mes.getDate() - 30)
                  setDataInicio(mes.toISOString().split('T')[0])
                  setDataFim(hoje.toISOString().split('T')[0])
                }}
              >
                Último Mês
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatorios.map(rel => (
          <Card key={rel.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${rel.cor}`}>
                  <rel.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{rel.titulo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{rel.descricao}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => rel.gerar(true)}
                  disabled={loading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => rel.gerar(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  Imprimir/PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dica */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Dica: Salvando como PDF</h3>
              <p className="text-sm text-blue-700 mt-1">
                Ao clicar em "Imprimir/PDF", uma janela de impressão será aberta. 
                Selecione "Salvar como PDF" como destino para baixar o relatório em formato PDF.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
