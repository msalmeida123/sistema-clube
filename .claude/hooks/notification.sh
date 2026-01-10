#!/bin/bash
# Hook: Notificações do Claude Code via WhatsApp (WaSender)

NOTIFICATION="$1"

# Configuração - defina essas variáveis de ambiente no seu sistema
WASENDER_API_KEY="${WASENDER_API_KEY:-}"
NOTIFY_PHONE="${CLAUDE_NOTIFY_PHONE:-}"

# Diretório de logs
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Log da notificação
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $NOTIFICATION" >> "$LOG_DIR/notifications.log"

# Função para enviar WhatsApp
send_whatsapp() {
    local message="$1"
    
    if [ -z "$WASENDER_API_KEY" ] || [ -z "$NOTIFY_PHONE" ]; then
        return 0
    fi
    
    curl -s -X POST "https://www.wasenderapi.com/api/send-message" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $WASENDER_API_KEY" \
        -d "{
            \"phone\": \"$NOTIFY_PHONE\",
            \"message\": \"$message\"
        }" > /dev/null 2>&1 &
}

# Filtrar notificações importantes
if echo "$NOTIFICATION" | grep -qiE "(erro|error|falhou|failed|exception)"; then
    send_whatsapp "❌ *Claude Code - ERRO*

$NOTIFICATION

📅 $(date '+%d/%m/%Y %H:%M')
📁 Projeto: sistema-clube"

elif echo "$NOTIFICATION" | grep -qiE "(completo|concluído|finished|done|sucesso|success)"; then
    send_whatsapp "✅ *Claude Code - Concluído*

$NOTIFICATION

📅 $(date '+%d/%m/%Y %H:%M')"

elif echo "$NOTIFICATION" | grep -qiE "(aviso|warning|atenção)"; then
    send_whatsapp "⚠️ *Claude Code - Aviso*

$NOTIFICATION

📅 $(date '+%d/%m/%Y %H:%M')"
fi

exit 0
