'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  History, Package, Calendar, Sparkles, Bug, Shield, 
  ArrowUp, Minus, AlertTriangle, Trash2, Clock
} from 'lucide-react'

// Versão atual - atualizar a cada release
const VERSAO_ATUAL = '1.5.0'
const DATA_RELEASE = '2026-01-10'

type TipoMudanca = 'added' | 'changed' | 'fixed' | 'removed' | 'deprecated' | 'security'

type Mudanca = {
  tipo: TipoMudanca
  descricao: string
}

type Release = {
  versao: string
  data: string
  mudancas: Mudanca[]
}

const releases: Release[] = [
  {
    versao: '1.5.0',
    data: '2026-01-10',
    mudancas: [
      { tipo: 'added', descricao: 'Dashboard: Filtro de 90 dias nas estatísticas' },
      { tipo: 'added', descricao: 'Claude Hooks: Sistema de notificações WhatsApp para eventos de desenvolvimento' },
      { tipo: 'added', descricao: 'Sidebar: Reorganização com seção WhatsApp CRM expansível' },
      { tipo: 'added', descricao: 'Setores Usuários: Página de configuração de permissões por setor' },
      { tipo: 'added', descricao: 'Kanban: Drag-and-drop horizontal e vertical com ordenação por prioridade' },
      { tipo: 'fixed', descricao: 'Validação de webhook com sessionId e deviceId' },
      { tipo: 'fixed', descricao: 'CSP para imagens do WhatsApp (pps.whatsapp.net)' },
      { tipo: 'fixed', descricao: 'Foreign key de setor_id na transferência de conversas' },
    ]
  },
  {
    versao: '1.4.0',
    data: '2026-01-10',
    mudancas: [
      { tipo: 'added', descricao: 'Sistema de Setores: Recepção, Vendas, Suporte, Financeiro, Diretoria' },
      { tipo: 'added', descricao: 'Transferência de Conversas: Entre setores com histórico' },
      { tipo: 'added', descricao: 'Permissões por Setor: Controle de acesso granular' },
      { tipo: 'added', descricao: 'Base de Conhecimento: 18 Q&A do estatuto do clube' },
      { tipo: 'changed', descricao: 'Performance do Kanban com ordenação otimizada' },
      { tipo: 'changed', descricao: 'UI dos filtros de setor no CRM' },
    ]
  },
  {
    versao: '1.3.0',
    data: '2026-01-09',
    mudancas: [
      { tipo: 'added', descricao: 'Kanban WhatsApp: Visualização em colunas por status' },
      { tipo: 'added', descricao: 'Fotos de Perfil: Sincronização automática do WhatsApp' },
      { tipo: 'added', descricao: 'Respostas Automáticas: Por setor e horário' },
      { tipo: 'fixed', descricao: 'Mensagens duplicadas no webhook' },
      { tipo: 'fixed', descricao: 'Ordenação de conversas por último contato' },
    ]
  },
  {
    versao: '1.2.0',
    data: '2026-01-08',
    mudancas: [
      { tipo: 'added', descricao: 'Bot IA (GPT): Respostas inteligentes com base de conhecimento' },
      { tipo: 'added', descricao: 'Templates de Mensagens: Respostas rápidas personalizáveis' },
      { tipo: 'added', descricao: 'Importação de Contatos: Do WhatsApp para o CRM' },
      { tipo: 'changed', descricao: 'Interface do CRM com preview de mídia' },
      { tipo: 'changed', descricao: 'Envio de arquivos (imagem, vídeo, documento, áudio)' },
    ]
  },
  {
    versao: '1.1.0',
    data: '2026-01-07',
    mudancas: [
      { tipo: 'added', descricao: 'CRM WhatsApp: Integração completa com WaSender' },
      { tipo: 'added', descricao: 'Realtime: Atualizações em tempo real via Supabase' },
      { tipo: 'added', descricao: 'Webhook: Recebimento de mensagens automático' },
      { tipo: 'fixed', descricao: 'Autenticação de usuários' },
      { tipo: 'fixed', descricao: 'RLS policies do Supabase' },
    ]
  },
  {
    versao: '1.0.0',
    data: '2026-01-05',
    mudancas: [
      { tipo: 'added', descricao: 'Dashboard Clube: Estatísticas de acessos e convites' },
      { tipo: 'added', descricao: 'Gestão de Associados: Cadastro completo com dependentes' },
      { tipo: 'added', descricao: 'Controle de Acesso: QR Code para piscina e sauna' },
      { tipo: 'added', descricao: 'Convites: Emissão e controle de convites para visitantes' },
      { tipo: 'added', descricao: 'Financeiro: Integração com Sicoob (boletos)' },
      { tipo: 'added', descricao: 'Eleições: Sistema de votação online' },
      { tipo: 'added', descricao: 'Relatórios: Exportação em PDF' },
    ]
  },
]

const tipoConfig: Record<TipoMudanca, { label: string; cor: string; icone: React.ReactNode }> = {
  added: { 
    label: 'Novo', 
    cor: 'bg-green-100 text-green-700 border-green-200',
    icone: <Sparkles className="h-3 w-3" />
  },
  changed: { 
    label: 'Alterado', 
    cor: 'bg-blue-100 text-blue-700 border-blue-200',
    icone: <ArrowUp className="h-3 w-3" />
  },
  fixed: { 
    label: 'Corrigido', 
    cor: 'bg-orange-100 text-orange-700 border-orange-200',
    icone: <Bug className="h-3 w-3" />
  },
  removed: { 
    label: 'Removido', 
    cor: 'bg-red-100 text-red-700 border-red-200',
    icone: <Trash2 className="h-3 w-3" />
  },
  deprecated: { 
    label: 'Depreciado', 
    cor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icone: <AlertTriangle className="h-3 w-3" />
  },
  security: { 
    label: 'Segurança', 
    cor: 'bg-purple-100 text-purple-700 border-purple-200',
    icone: <Shield className="h-3 w-3" />
  },
}

export default function VersaoPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            Histórico de Versões
          </h1>
          <p className="text-muted-foreground">Acompanhe as atualizações do sistema</p>
        </div>
      </div>

      {/* Versão Atual */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Versão Atual</p>
                <p className="text-3xl font-bold text-blue-600">v{VERSAO_ATUAL}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                <Calendar className="h-4 w-4" />
                Última atualização
              </p>
              <p className="text-lg font-medium">
                {new Date(DATA_RELEASE).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(tipoConfig).map(([tipo, config]) => (
          <Badge key={tipo} variant="outline" className={`${config.cor} flex items-center gap-1`}>
            {config.icone}
            {config.label}
          </Badge>
        ))}
      </div>

      {/* Timeline de Releases */}
      <div className="space-y-6">
        {releases.map((release, index) => (
          <Card key={release.versao} className={index === 0 ? 'border-blue-200' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className={`text-xl ${index === 0 ? 'text-blue-600' : ''}`}>
                    v{release.versao}
                  </span>
                  {index === 0 && (
                    <Badge className="bg-blue-600">Atual</Badge>
                  )}
                </CardTitle>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(release.data).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {release.mudancas.map((mudanca, i) => {
                  const config = tipoConfig[mudanca.tipo]
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${config.cor} flex items-center gap-1 shrink-0 mt-0.5`}
                      >
                        {config.icone}
                        {config.label}
                      </Badge>
                      <span className="text-sm">{mudanca.descricao}</span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        <p>Sistema Clube © 2026 - Desenvolvido com ❤️</p>
        <p className="mt-1">
          Veja o changelog completo no{' '}
          <a 
            href="https://github.com/msalmeida123/sistema-clube/blob/main/CHANGELOG.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  )
}
