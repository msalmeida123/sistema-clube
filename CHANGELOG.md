# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.5.0] - 2026-01-10

### Adicionado
- **Dashboard**: Filtro de 90 dias nas estatísticas
- **Claude Hooks**: Sistema de notificações WhatsApp para eventos de desenvolvimento
- **Sidebar**: Reorganização com seção WhatsApp CRM expansível
- **Setores Usuários**: Página de configuração de permissões por setor
- **Kanban**: Drag-and-drop horizontal e vertical com ordenação por prioridade

### Corrigido
- Validação de webhook com sessionId e deviceId
- CSP para imagens do WhatsApp (pps.whatsapp.net)
- Foreign key de setor_id na transferência de conversas

## [1.4.0] - 2026-01-10

### Adicionado
- **Sistema de Setores**: Recepção, Vendas, Suporte, Financeiro, Diretoria
- **Transferência de Conversas**: Entre setores com histórico
- **Permissões por Setor**: Controle de acesso granular
- **Base de Conhecimento**: 18 Q&A do estatuto do clube

### Melhorado
- Performance do Kanban com ordenação otimizada
- UI dos filtros de setor no CRM

## [1.3.0] - 2026-01-09

### Adicionado
- **Kanban WhatsApp**: Visualização em colunas por status
- **Fotos de Perfil**: Sincronização automática do WhatsApp
- **Respostas Automáticas**: Por setor e horário

### Corrigido
- Mensagens duplicadas no webhook
- Ordenação de conversas por último contato

## [1.2.0] - 2026-01-08

### Adicionado
- **Bot IA (GPT)**: Respostas inteligentes com base de conhecimento
- **Templates de Mensagens**: Respostas rápidas personalizáveis
- **Importação de Contatos**: Do WhatsApp para o CRM

### Melhorado
- Interface do CRM com preview de mídia
- Envio de arquivos (imagem, vídeo, documento, áudio)

## [1.1.0] - 2026-01-07

### Adicionado
- **CRM WhatsApp**: Integração completa com WaSender
- **Realtime**: Atualizações em tempo real via Supabase
- **Webhook**: Recebimento de mensagens automático

### Corrigido
- Autenticação de usuários
- RLS policies do Supabase

## [1.0.0] - 2026-01-05

### Adicionado
- **Dashboard Clube**: Estatísticas de acessos e convites
- **Gestão de Associados**: Cadastro completo com dependentes
- **Controle de Acesso**: QR Code para piscina e sauna
- **Convites**: Emissão e controle de convites para visitantes
- **Financeiro**: Integração com Sicoob (boletos)
- **Eleições**: Sistema de votação online
- **Relatórios**: Exportação em PDF

---

## Legenda

- **Adicionado**: Novas funcionalidades
- **Alterado**: Mudanças em funcionalidades existentes
- **Depreciado**: Funcionalidades que serão removidas em breve
- **Removido**: Funcionalidades removidas
- **Corrigido**: Correções de bugs
- **Segurança**: Correções de vulnerabilidades
