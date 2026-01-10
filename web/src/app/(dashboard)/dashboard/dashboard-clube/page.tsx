'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  Waves, Users, Ticket, TrendingUp, Calendar, Clock,
  Download, FileText, Loader2, RefreshCw, DollarSign,
  BarChart3, PieChart as PieChartIcon, Filter
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts'

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

type Acesso = {
  id: string
  data_hora: string
  tipo: string
  local: string
  associado?: { nome: string; numero_titulo: string }
  dependente?: { nome: string }
}

type Convite = {
  id: string
  convidado_nome: string
  valor_pago: number
  status: string
  data_entrada: string | null
  created_at: string
  associado?: { nome: string }
}

export default function DashboardClubePage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | '90dias'>('mes')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  
  // Dados
  const [acessosPiscina, setAcessosPiscina] = useState<Acesso[]>([])
  const [convites, setConvites] = useState<Convite[]>([])
  const [acessosPorDia, setAcessosPorDia] = useState<any[]>([])
  const [acessosPorHora, setAcessosPorHora] = useState<any[]>([])
  const [convitesPorStatus, setConvitesPorStatus] = useState<any[]>([])
  const [convitesPorDia, setConvitesPorDia] = useState<any[]>([])
  const [topAssociados, setTopAssociados] = useState<any[]>([])
  
  // Estatísticas
  const [stats, setStats] = useState({
    totalAcessos: 0,
    acessosAssociados: 0,
    acessosDependentes: 0,
    totalConvites: 0,
    convitesUsados: 0,
    receitaConvites: 0,
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    const hoje = new Date()
    let inicio: Date
    
    switch (periodo) {
      case 'hoje':
        inicio = new Date(hoje.setHours(0, 0, 0, 0))
        break
      case 'semana':
        inicio = new Date(hoje)
        inicio.setDate(inicio.getDate() - 7)
        break
      case '90dias':
        inicio = new Date(hoje)
        inicio.setDate(inicio.getDate() - 90)
        break
      case 'mes':
      default:
        inicio = new Date(hoje)
        inicio.setDate(inicio.getDate() - 30)
    }
    
    setDataInicio(inicio.toISOString().split('T')[0])
    setDataFim(new Date().toISOString().split('T')[0])
  }, [periodo])

  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarDados()
    }
  }, [dataInicio, dataFim])

  const carregarDados = async () => {
    setLoading(true)
    
    const inicio = new Date(dataInicio)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(23, 59, 59, 999)

    // Buscar acessos da piscina
    const { data: acessosData } = await supabase
      .from('acessos_piscina')
      .select(`
        *,
        associado:associados(nome, numero_titulo),
        dependente:dependentes(nome)
      `)
      .gte('data_hora', inicio.toISOString())
      .lte('data_hora', fim.toISOString())
      .order('data_hora', { ascending: false })

    // Buscar convites
    const { data: convitesData } = await supabase
      .from('convites')
      .select(`
        *,
        associado:associados(nome)
      `)
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString())
      .order('created_at', { ascending: false })

    const acessos = acessosData || []
    const convitesList = convitesData || []

    setAcessosPiscina(acessos)
    setConvites(convitesList)

    // Calcular estatísticas
    const acessosAssoc = acessos.filter(a => a.associado).length
    const acessosDep = acessos.filter(a => a.dependente).length
    const convitesUsados = convitesList.filter(c => c.status === 'utilizado').length
    const receita = convitesList.reduce((acc, c) => acc + (c.valor_pago || 0), 0)

    setStats({
      totalAcessos: acessos.length,
      acessosAssociados: acessosAssoc,
      acessosDependentes: acessosDep,
      totalConvites: convitesList.length,
      convitesUsados,
      receitaConvites: receita,
    })

    // Processar dados para gráficos
    processarAcessosPorDia(acessos)
    processarAcessosPorHora(acessos)
    processarConvitesPorStatus(convitesList)
    processarConvitesPorDia(convitesList)
    processarTopAssociados(acessos)

    setLoading(false)
  }

  const processarAcessosPorDia = (acessos: Acesso[]) => {
    const porDia: { [key: string]: number } = {}
    
    acessos.forEach(acesso => {
      const data = new Date(acesso.data_hora).toLocaleDateString('pt-BR')
      porDia[data] = (porDia[data] || 0) + 1
    })

    // Ajustar quantidade de dias mostrados baseado no período
    const diasMostrar = periodo === '90dias' ? 30 : 14

    const dados = Object.entries(porDia)
      .map(([data, quantidade]) => ({ data, quantidade }))
      .reverse()
      .slice(-diasMostrar)

    setAcessosPorDia(dados)
  }

  const processarAcessosPorHora = (acessos: Acesso[]) => {
    const porHora: { [key: string]: number } = {}
    
    for (let i = 6; i <= 22; i++) {
      porHora[`${i}h`] = 0
    }
    
    acessos.forEach(acesso => {
      const hora = new Date(acesso.data_hora).getHours()
      if (hora >= 6 && hora <= 22) {
        porHora[`${hora}h`] = (porHora[`${hora}h`] || 0) + 1
      }
    })

    const dados = Object.entries(porHora)
      .map(([hora, quantidade]) => ({ hora, quantidade }))

    setAcessosPorHora(dados)
  }

  const processarConvitesPorStatus = (convites: Convite[]) => {
    const porStatus: { [key: string]: number } = {
      'ativo': 0,
      'utilizado': 0,
      'expirado': 0,
      'cancelado': 0,
    }
    
    convites.forEach(convite => {
      const status = convite.status || 'ativo'
      porStatus[status] = (porStatus[status] || 0) + 1
    })

    const dados = Object.entries(porStatus)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name: traduzirStatus(name), value }))

    setConvitesPorStatus(dados)
  }

  const traduzirStatus = (status: string) => {
    const traducoes: { [key: string]: string } = {
      'ativo': 'Ativos',
      'utilizado': 'Utilizados',
      'expirado': 'Expirados',
      'cancelado': 'Cancelados',
    }
    return traducoes[status] || status
  }

  const processarConvitesPorDia = (convites: Convite[]) => {
    const porDia: { [key: string]: { vendidos: number; usados: number } } = {}
    
    convites.forEach(convite => {
      const data = new Date(convite.created_at).toLocaleDateString('pt-BR')
      if (!porDia[data]) {
        porDia[data] = { vendidos: 0, usados: 0 }
      }
      porDia[data].vendidos++
      if (convite.status === 'utilizado') {
        porDia[data].usados++
      }
    })

    // Ajustar quantidade de dias mostrados baseado no período
    const diasMostrar = periodo === '90dias' ? 30 : 14

    const dados = Object.entries(porDia)
      .map(([data, valores]) => ({ data, ...valores }))
      .reverse()
      .slice(-diasMostrar)

    setConvitesPorDia(dados)
  }

  const processarTopAssociados = (acessos: Acesso[]) => {
    const contagem: { [key: string]: { nome: string; quantidade: number } } = {}
    
    acessos.forEach(acesso => {
      if (acesso.associado) {
        const nome = acesso.associado.nome
        if (!contagem[nome]) {
          contagem[nome] = { nome, quantidade: 0 }
        }
        contagem[nome].quantidade++
      }
    })

    const dados = Object.values(contagem)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    setTopAssociados(dados)
  }

  const exportarPDF = async (tipo: string) => {
    toast.loading('Gerando relatório...')
    
    // Criar conteúdo HTML para o relatório
    let conteudo = ''
    const dataRelatorio = new Date().toLocaleDateString('pt-BR')
    const periodoTexto = `${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`

    switch (tipo) {
      case 'acessos':
        conteudo = gerarRelatorioAcessos(periodoTexto)
        break
      case 'convites':
        conteudo = gerarRelatorioConvites(periodoTexto)
        break
      case 'completo':
        conteudo = gerarRelatorioCompleto(periodoTexto)
        break
    }

    // Abrir em nova janela para impressão/PDF
    const janela = window.open('', '_blank')
    if (janela) {
      janela.document.write(conteudo)
      janela.document.close()
      janela.onload = () => {
        janela.print()
      }
    }

    toast.dismiss()
    toast.success('Relatório gerado!')
  }

  const gerarRelatorioAcessos = (periodo: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Acessos - Piscina</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .stat-label { color: #6b7280; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; }
          tr:nth-child(even) { background: #f9fafb; }
          .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏊 Relatório de Acessos - Piscina</h1>
        </div>
        <p><strong>Período:</strong> ${periodo}</p>
        <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${stats.totalAcessos}</div>
            <div class="stat-label">Total de Acessos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.acessosAssociados}</div>
            <div class="stat-label">Associados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.acessosDependentes}</div>
            <div class="stat-label">Dependentes</div>
          </div>
        </div>

        <h2>Acessos por Dia</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            ${acessosPorDia.map(d => `
              <tr>
                <td>${d.data}</td>
                <td>${d.quantidade}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Top 10 Associados por Frequência</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Associado</th>
              <th>Acessos</th>
            </tr>
          </thead>
          <tbody>
            ${topAssociados.map((a, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${a.nome}</td>
                <td>${a.quantidade}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Lista de Acessos Detalhada</h2>
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Nome</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            ${acessosPiscina.slice(0, 100).map(a => `
              <tr>
                <td>${new Date(a.data_hora).toLocaleString('pt-BR')}</td>
                <td>${a.associado?.nome || a.dependente?.nome || '-'}</td>
                <td>${a.associado ? 'Associado' : 'Dependente'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${acessosPiscina.length > 100 ? '<p><em>Mostrando apenas os 100 primeiros registros</em></p>' : ''}

        <div class="footer">
          <p>Sistema Clube - Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `
  }

  const gerarRelatorioConvites = (periodo: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Convites</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #7c3aed; }
          .stat-label { color: #6b7280; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; }
          tr:nth-child(even) { background: #f9fafb; }
          .status-ativo { color: #10b981; }
          .status-utilizado { color: #3b82f6; }
          .status-expirado { color: #f59e0b; }
          .status-cancelado { color: #ef4444; }
          .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>🎫 Relatório de Convites</h1>
        <p><strong>Período:</strong> ${periodo}</p>
        <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${stats.totalConvites}</div>
            <div class="stat-label">Total Emitidos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.convitesUsados}</div>
            <div class="stat-label">Utilizados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalConvites - stats.convitesUsados}</div>
            <div class="stat-label">Não Utilizados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">R$ ${stats.receitaConvites.toFixed(2)}</div>
            <div class="stat-label">Receita Total</div>
          </div>
        </div>

        <h2>Convites por Status</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Quantidade</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            ${convitesPorStatus.map(s => `
              <tr>
                <td>${s.name}</td>
                <td>${s.value}</td>
                <td>${((s.value / stats.totalConvites) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Convites por Dia</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Vendidos</th>
              <th>Utilizados</th>
            </tr>
          </thead>
          <tbody>
            ${convitesPorDia.map(d => `
              <tr>
                <td>${d.data}</td>
                <td>${d.vendidos}</td>
                <td>${d.usados}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Lista de Convites Detalhada</h2>
        <table>
          <thead>
            <tr>
              <th>Data Emissão</th>
              <th>Convidado</th>
              <th>Associado Responsável</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${convites.map(c => `
              <tr>
                <td>${new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                <td>${c.convidado_nome}</td>
                <td>${c.associado?.nome || '-'}</td>
                <td>R$ ${(c.valor_pago || 0).toFixed(2)}</td>
                <td class="status-${c.status}">${traduzirStatus(c.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Sistema Clube - Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `
  }

  const gerarRelatorioCompleto = (periodo: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Completo do Clube</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 20px; font-weight: bold; }
          .stat-label { color: #6b7280; font-size: 12px; }
          .blue { color: #1e40af; }
          .green { color: #10b981; }
          .purple { color: #7c3aed; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; }
          tr:nth-child(even) { background: #f9fafb; }
          .section { page-break-inside: avoid; margin-bottom: 30px; }
          .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          @media print { 
            body { padding: 0; } 
            .section { page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <h1>📊 Relatório Completo do Clube</h1>
        <p><strong>Período:</strong> ${periodo}</p>
        <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>

        <div class="section">
          <h2>📈 Resumo Geral</h2>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value blue">${stats.totalAcessos}</div>
              <div class="stat-label">Acessos Piscina</div>
            </div>
            <div class="stat-card">
              <div class="stat-value green">${stats.acessosAssociados}</div>
              <div class="stat-label">Associados</div>
            </div>
            <div class="stat-card">
              <div class="stat-value green">${stats.acessosDependentes}</div>
              <div class="stat-label">Dependentes</div>
            </div>
            <div class="stat-card">
              <div class="stat-value purple">${stats.totalConvites}</div>
              <div class="stat-label">Convites Emitidos</div>
            </div>
            <div class="stat-card">
              <div class="stat-value purple">${stats.convitesUsados}</div>
              <div class="stat-label">Convites Usados</div>
            </div>
            <div class="stat-card">
              <div class="stat-value green">R$ ${stats.receitaConvites.toFixed(2)}</div>
              <div class="stat-label">Receita Convites</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>🏊 Acessos à Piscina por Dia</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              ${acessosPorDia.map(d => `
                <tr>
                  <td>${d.data}</td>
                  <td>${d.quantidade}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>⏰ Acessos por Horário</h2>
          <table>
            <thead>
              <tr>
                <th>Horário</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              ${acessosPorHora.filter(h => h.quantidade > 0).map(h => `
                <tr>
                  <td>${h.hora}</td>
                  <td>${h.quantidade}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🏆 Top 10 Associados por Frequência</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Associado</th>
                <th>Acessos</th>
              </tr>
            </thead>
            <tbody>
              ${topAssociados.map((a, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${a.nome}</td>
                  <td>${a.quantidade}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🎫 Convites por Status</h2>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Quantidade</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              ${convitesPorStatus.map(s => `
                <tr>
                  <td>${s.name}</td>
                  <td>${s.value}</td>
                  <td>${stats.totalConvites > 0 ? ((s.value / stats.totalConvites) * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📋 Lista de Acessos (Últimos 50)</h2>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Nome</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              ${acessosPiscina.slice(0, 50).map(a => `
                <tr>
                  <td>${new Date(a.data_hora).toLocaleString('pt-BR')}</td>
                  <td>${a.associado?.nome || a.dependente?.nome || '-'}</td>
                  <td>${a.associado ? 'Associado' : 'Dependente'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🎟️ Lista de Convites</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Convidado</th>
                <th>Responsável</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${convites.slice(0, 50).map(c => `
                <tr>
                  <td>${new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>${c.convidado_nome}</td>
                  <td>${c.associado?.nome || '-'}</td>
                  <td>R$ ${(c.valor_pago || 0).toFixed(2)}</td>
                  <td>${traduzirStatus(c.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Sistema Clube - Relatório gerado automaticamente</p>
          <p>${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Dashboard do Clube
          </h1>
          <p className="text-muted-foreground">Estatísticas de acessos e convites</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregarDados}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex gap-2">
              <Button
                variant={periodo === 'hoje' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodo('hoje')}
              >
                Hoje
              </Button>
              <Button
                variant={periodo === 'semana' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodo('semana')}
              >
                7 Dias
              </Button>
              <Button
                variant={periodo === 'mes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodo('mes')}
              >
                30 Dias
              </Button>
              <Button
                variant={periodo === '90dias' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodo('90dias')}
              >
                90 Dias
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-gray-500" />
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
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => exportarPDF('acessos')}>
                <Download className="h-4 w-4 mr-2" />
                Acessos PDF
              </Button>
              <Button variant="outline" onClick={() => exportarPDF('convites')}>
                <Download className="h-4 w-4 mr-2" />
                Convites PDF
              </Button>
              <Button onClick={() => exportarPDF('completo')} className="bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4 mr-2" />
                Relatório Completo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Waves className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalAcessos}</div>
                <div className="text-xs text-muted-foreground">Acessos Piscina</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.acessosAssociados}</div>
                <div className="text-xs text-muted-foreground">Associados</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.acessosDependentes}</div>
                <div className="text-xs text-muted-foreground">Dependentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Ticket className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalConvites}</div>
                <div className="text-xs text-muted-foreground">Convites</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Ticket className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.convitesUsados}</div>
                <div className="text-xs text-muted-foreground">Usados</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">R$ {stats.receitaConvites.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Receita</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Acessos por Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Acessos por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={acessosPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="quantidade" 
                  stroke="#3b82f6" 
                  fill="#93c5fd" 
                  name="Acessos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Acessos por Horário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Acessos por Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={acessosPorHora}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#10b981" name="Acessos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Convites por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-600" />
              Convites por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={convitesPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {convitesPorStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Convites por Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-600" />
              Convites Vendidos x Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={convitesPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="vendidos" fill="#f59e0b" name="Vendidos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="usados" fill="#10b981" name="Utilizados" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Associados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Top 10 Associados por Frequência na Piscina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topAssociados} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="nome" type="category" fontSize={12} width={150} />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#3b82f6" name="Acessos" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
