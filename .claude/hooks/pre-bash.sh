#!/bin/bash
# Hook: Validação de segurança ANTES de executar comandos bash
# Bloqueia comandos perigosos

COMMAND="$1"

# Lista de padrões perigosos
DANGEROUS_PATTERNS=(
    "rm -rf /"
    "rm -rf /*"
    "chmod 777"
    "chmod -R 777"
    "> /dev/sda"
    "mkfs."
    "dd if="
    ":(){ :|:& };:"
    "curl.*|.*bash"
    "wget.*|.*bash"
    "eval.*base64"
)

# Verificar se o comando contém padrões perigosos
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    if echo "$COMMAND" | grep -qE "$pattern"; then
        echo "❌ BLOQUEADO: Comando potencialmente perigoso detectado!"
        echo "   Padrão: $pattern"
        echo "   Comando: $COMMAND"
        exit 1
    fi
done

# Verificar se está tentando acessar arquivos sensíveis
SENSITIVE_FILES=(
    "/etc/passwd"
    "/etc/shadow"
    ".env"
    "id_rsa"
    "credentials"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if echo "$COMMAND" | grep -qE "(cat|less|more|head|tail|vim|nano).*$file"; then
        echo "⚠️ AVISO: Acesso a arquivo sensível detectado: $file"
        # Não bloqueia, apenas avisa
    fi
done

# Log do comando (opcional - descomente para ativar)
# echo "[$(date '+%Y-%m-%d %H:%M:%S')] PRE-BASH: $COMMAND" >> .claude/logs/commands.log

exit 0
