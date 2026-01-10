#!/bin/bash
# Hook: Detectar commits e deploys APÓS comandos bash
# Envia notificações via WhatsApp (WaSender)

COMMAND="$1"
OUTPUT="$2"

# Configuração - defina essas variáveis de ambiente no seu sistema
WASENDER_API_KEY="${WASENDER_API_KEY:-}"
NOTIFY_PHONE="${CLAUDE_NOTIFY_PHONE:-}"

# Diretório de logs
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Função para enviar WhatsApp
send_whatsapp() {
    local message="$1"
    
    if [ -z "$WASENDER_API_KEY" ] || [ -z "$NOTIFY_PHONE" ]; then
        echo "$message"  # Apenas exibe se não tiver configurado
        return 0
    fi
    
    curl -s -X POST "https://www.wasenderapi.com/api/send-message" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $WASENDER_API_KEY" \
        -d "{
            \"phone\": \"$NOTIFY_PHONE\",
            \"message\": \"$message\"
        }" > /dev/null 2>&1 &
    
    echo "$message"
}

# Função para log local
log_event() {
    local event="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $event: $message" >> "$LOG_DIR/events.log"
}

# Detectar git commit
if echo "$COMMAND" | grep -qE "git commit"; then
    COMMIT_MSG=$(echo "$OUTPUT" | grep -oP '(?<=\[main )[^\]]+' | head -1)
    log_event "GIT_COMMIT" "$COMMIT_MSG"
    send_whatsapp "📝 *Novo Commit*

$COMMIT_MSG

📅 $(date '+%d/%m/%Y %H:%M')
📁 sistema-clube"
fi

# Detectar git push
if echo "$COMMAND" | grep -qE "git push"; then
    log_event "GIT_PUSH" "Push realizado"
    send_whatsapp "🚀 *Push Realizado*

Deploy em andamento...

📅 $(date '+%d/%m/%Y %H:%M')
📁 sistema-clube"
fi

# Detectar docker deploy
if echo "$COMMAND" | grep -qE "docker (pull|service update|stack deploy)"; then
    log_event "DOCKER_DEPLOY" "Deploy Docker executado"
    send_whatsapp "🐳 *Deploy Docker*

Atualização aplicada!

📅 $(date '+%d/%m/%Y %H:%M')
📁 sistema-clube"
fi

# Detectar npm/yarn test
if echo "$COMMAND" | grep -qE "(npm|yarn|pnpm) (test|run test)"; then
    if echo "$OUTPUT" | grep -qE "(PASS|passed|success)"; then
        log_event "TESTS_PASSED" "Testes passaram"
        send_whatsapp "✅ *Testes Passaram*

Todos os testes OK!

📅 $(date '+%d/%m/%Y %H:%M')"
    elif echo "$OUTPUT" | grep -qE "(FAIL|failed|error)"; then
        log_event "TESTS_FAILED" "Testes falharam"
        send_whatsapp "❌ *Testes Falharam*

Verifique os erros!

📅 $(date '+%d/%m/%Y %H:%M')"
    fi
fi

# Detectar npm install com erros
if echo "$COMMAND" | grep -qE "(npm|yarn|pnpm) install"; then
    if echo "$OUTPUT" | grep -qE "(ERR|error|failed)"; then
        log_event "NPM_ERROR" "Erro na instalação"
        send_whatsapp "⚠️ *Erro NPM*

Falha na instalação de dependências

📅 $(date '+%d/%m/%Y %H:%M')"
    fi
fi

exit 0
