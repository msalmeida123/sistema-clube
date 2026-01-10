#!/bin/bash
# Hook: Backup automático ANTES de editar arquivos

FILE_PATH="$1"

# Ignorar se não for um arquivo válido
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
    exit 0
fi

# Diretório de backups
BACKUP_DIR=".claude/backups"
mkdir -p "$BACKUP_DIR"

# Nome do arquivo de backup com timestamp
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
FILENAME=$(basename "$FILE_PATH")
BACKUP_FILE="$BACKUP_DIR/${FILENAME}.${TIMESTAMP}.bak"

# Criar backup
cp "$FILE_PATH" "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "📦 Backup criado: $BACKUP_FILE"
else
    echo "⚠️ Não foi possível criar backup de: $FILE_PATH"
fi

# Limpar backups antigos (manter apenas últimos 10 por arquivo)
find "$BACKUP_DIR" -name "${FILENAME}.*.bak" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null

exit 0
