# 🔧 Claude Code Hooks

Configuração de hooks para automação e segurança no Claude Code.

## 📁 Estrutura

```
.claude/
├── settings.json      # Configuração principal
├── hooks/
│   ├── pre-bash.sh    # Validação de segurança (antes de comandos)
│   ├── pre-edit.sh    # Backup automático (antes de editar)
│   ├── post-edit.sh   # Formatação automática (após editar)
│   ├── post-bash.sh   # Detecção de commits/deploy (após comandos)
│   └── notification.sh # Notificações
├── backups/           # Backups de arquivos (não commitado)
└── logs/              # Logs de eventos (não commitado)
```

## 🛡️ Hooks Disponíveis

### 1. Pre-Bash (Segurança)
Bloqueia comandos perigosos antes de executar:
- `rm -rf /`
- `chmod 777`
- Downloads com pipe para bash
- Acesso a arquivos sensíveis

### 2. Pre-Edit (Backup)
Cria backup automático antes de editar qualquer arquivo:
- Salva em `.claude/backups/`
- Mantém últimos 10 backups por arquivo
- Formato: `arquivo.extensão.YYYYMMDD_HHMMSS.bak`

### 3. Post-Edit (Formatação)
Após editar arquivos no diretório `web/`:
- Formata com Prettier (ts, tsx, js, jsx, css, json, md)
- Verifica com ESLint (apenas aviso)
- Detecta possíveis credenciais expostas

### 4. Post-Bash (Detecção)
Detecta eventos importantes após comandos:
- Git commit/push
- Docker deploy
- npm test (passa/falha)
- Erros de instalação

### 5. Notification (Alertas)
Processa notificações do Claude Code:
- Salva em log local
- Pode enviar para n8n webhook
- Pode enviar para WhatsApp (WaSender)

## ⚙️ Configuração

### Variáveis de Ambiente (opcional)

```bash
# Webhook do n8n para receber notificações
export CLAUDE_N8N_WEBHOOK="https://seu-n8n.com/webhook/xxxxx"

# Para notificações WhatsApp (descomente no notification.sh)
export WASENDER_API_KEY="sua-api-key"
export CLAUDE_NOTIFY_PHONE="5516999999999"
```

### Permissões dos Scripts

No Linux/Mac, garanta que os scripts são executáveis:

```bash
chmod +x .claude/hooks/*.sh
```

## 📋 Logs

Os logs são salvos em `.claude/logs/`:
- `events.log` - Commits, deploys, testes
- `notifications.log` - Notificações do Claude
- `commands.log` - Todos os comandos (se ativado)

## 🔒 Segurança

Comandos bloqueados:
- Remoção recursiva da raiz
- Permissões 777 globais
- Fork bombs
- Downloads suspeitos com exec

Arquivos monitorados:
- `.env`, `credentials`, `id_rsa`
- `/etc/passwd`, `/etc/shadow`

## 📱 Integração n8n

Configure um webhook no n8n para receber eventos:

```json
{
  "event": "GIT_COMMIT",
  "message": "feat: nova feature",
  "timestamp": "2026-01-10T10:00:00-03:00",
  "project": "sistema-clube"
}
```

Eventos possíveis:
- `GIT_COMMIT` - Novo commit
- `GIT_PUSH` - Push para repositório
- `DOCKER_DEPLOY` - Deploy via Docker
- `TESTS_PASSED` / `TESTS_FAILED` - Resultado de testes
- `NPM_ERROR` - Erro na instalação
- `claude_notification` - Notificação geral
