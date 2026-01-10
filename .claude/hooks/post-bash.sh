#!/bin/bash
# Hook: Detectar commits e deploys APÓS comandos bash

COMMAND="$1"
OUTPUT="$2"

# URL do webhook n8n para notificações (configure sua URL aqui)
N8N_WEBHOOK_URL="${CLAUDE_N8N_WEBHOOK:-}"

# Função para enviar notificação
send_notification() {
    local event="$1"
    local message="$2"
    
    # Se tiver webhook configurado, enviar notificação
    if [ -n "$N8N_WEBHOOK_URL" ]; then
        curl -s -X POST "$N8N_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"event\": \"$event\", \"message\": \"$message\", \"timestamp\": \"$(date -Iseconds)\"}" \
            > /dev/null 2>&1 &
    fi
    
    # Log local
    mkdir -p .claude/logs
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $event: $message" >> .claude/logs/events.log
}

# Detectar git commit
if echo "$COMMAND" | grep -qE "git commit"; then
    COMMIT_MSG=$(echo "$OUTPUT" | grep -oP '(?<=\[main )[^\]]+' | head -1)
    send_notification "GIT_COMMIT" "Novo commit: $COMMIT_MSG"
    echo "📝 Commit detectado!"
fi

# Detectar git push
if echo "$COMMAND" | grep -qE "git push"; then
    send_notification "GIT_PUSH" "Push realizado para o repositório"
    echo "🚀 Push detectado! Deploy pode estar em andamento..."
fi

# Detectar docker deploy
if echo "$COMMAND" | grep -qE "docker (pull|service update|stack deploy)"; then
    send_notification "DOCKER_DEPLOY" "Deploy Docker executado"
    echo "🐳 Deploy Docker detectado!"
fi

# Detectar npm/yarn test
if echo "$COMMAND" | grep -qE "(npm|yarn|pnpm) (test|run test)"; then
    if echo "$OUTPUT" | grep -qE "(PASS|passed|success)"; then
        send_notification "TESTS_PASSED" "Testes passaram com sucesso"
        echo "✅ Testes passaram!"
    elif echo "$OUTPUT" | grep -qE "(FAIL|failed|error)"; then
        send_notification "TESTS_FAILED" "Testes falharam"
        echo "❌ Testes falharam!"
    fi
fi

# Detectar npm install com erros
if echo "$COMMAND" | grep -qE "(npm|yarn|pnpm) install"; then
    if echo "$OUTPUT" | grep -qE "(ERR|error|failed)"; then
        send_notification "NPM_ERROR" "Erro durante instalação de dependências"
        echo "⚠️ Erro na instalação de dependências!"
    fi
fi

exit 0
