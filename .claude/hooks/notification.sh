#!/bin/bash
# Hook: Notificações do Claude Code

NOTIFICATION="$1"

# URL do webhook n8n para notificações (configure sua URL aqui)
N8N_WEBHOOK_URL="${CLAUDE_N8N_WEBHOOK:-}"

# Diretório de logs
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Log da notificação
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $NOTIFICATION" >> "$LOG_DIR/notifications.log"

# Se tiver webhook configurado, enviar notificação
if [ -n "$N8N_WEBHOOK_URL" ]; then
    curl -s -X POST "$N8N_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"claude_notification\",
            \"message\": \"$NOTIFICATION\",
            \"timestamp\": \"$(date -Iseconds)\",
            \"project\": \"sistema-clube\"
        }" \
        > /dev/null 2>&1 &
fi

# Notificações importantes podem ser enviadas para WhatsApp via WaSender
# Descomente e configure se quiser receber no WhatsApp
# 
# WASENDER_API_KEY="${WASENDER_API_KEY:-}"
# NOTIFY_PHONE="${CLAUDE_NOTIFY_PHONE:-}"
# 
# if [ -n "$WASENDER_API_KEY" ] && [ -n "$NOTIFY_PHONE" ]; then
#     # Apenas para notificações importantes (erros, conclusões)
#     if echo "$NOTIFICATION" | grep -qiE "(erro|error|falhou|failed|completo|concluído|finished)"; then
#         curl -s -X POST "https://www.wasenderapi.com/api/send-message" \
#             -H "Content-Type: application/json" \
#             -H "Authorization: Bearer $WASENDER_API_KEY" \
#             -d "{
#                 \"phone\": \"$NOTIFY_PHONE\",
#                 \"message\": \"🤖 Claude Code: $NOTIFICATION\"
#             }" \
#             > /dev/null 2>&1 &
#     fi
# fi

# Som de notificação (apenas macOS)
# afplay /System/Library/Sounds/Ping.aiff 2>/dev/null &

exit 0
