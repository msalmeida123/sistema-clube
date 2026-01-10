#!/bin/bash
# Hook: Formatação automática APÓS editar arquivos

FILE_PATH="$1"

# Ignorar se não for um arquivo válido
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
    exit 0
fi

# Extrair extensão do arquivo
EXTENSION="${FILE_PATH##*.}"

# Verificar se estamos no diretório web (onde tem prettier/eslint)
if [[ "$FILE_PATH" == *"/web/"* ]] || [[ "$FILE_PATH" == "web/"* ]]; then
    cd web 2>/dev/null || exit 0
    
    case "$EXTENSION" in
        ts|tsx|js|jsx)
            # Formatar com Prettier
            if [ -f "node_modules/.bin/prettier" ]; then
                npx prettier --write "../$FILE_PATH" 2>/dev/null && echo "✨ Formatado com Prettier: $FILE_PATH"
            fi
            
            # Lint com ESLint (apenas verificar, não corrigir automaticamente)
            if [ -f "node_modules/.bin/eslint" ]; then
                LINT_OUTPUT=$(npx eslint "../$FILE_PATH" 2>/dev/null)
                if [ -n "$LINT_OUTPUT" ]; then
                    echo "⚠️ ESLint encontrou problemas em: $FILE_PATH"
                fi
            fi
            ;;
        css|scss|json|md)
            # Apenas Prettier para esses tipos
            if [ -f "node_modules/.bin/prettier" ]; then
                npx prettier --write "../$FILE_PATH" 2>/dev/null && echo "✨ Formatado com Prettier: $FILE_PATH"
            fi
            ;;
    esac
    
    cd - > /dev/null
fi

# Verificar se há senhas/chaves expostas no arquivo
if grep -qE "(password|secret|api_key|apikey|token|credential).*=.*['\"][^'\"]{8,}['\"]" "$FILE_PATH" 2>/dev/null; then
    echo "🔐 AVISO: Possível credencial exposta em: $FILE_PATH"
    echo "   Verifique se não está commitando senhas/chaves!"
fi

exit 0
