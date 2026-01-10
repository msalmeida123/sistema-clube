# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments para variáveis de ambiente
ARG NEXT_PUBLIC_SUPABASE_URL=https://fkjjjpgxkjhqkhmdpmzk.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrampqcGd4a2pocWtobWRwbXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDI0NTYsImV4cCI6MjA4MjE3ODQ1Nn0.c0wUGT2Ah2RW5lPJ5EhS738349AdvXsnnsoQvNjM5PY
ARG SUPABASE_SERVICE_ROLE_KEY

# Converter ARG em ENV para o build do Next.js
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Copiar arquivos de dependências
COPY package*.json ./
COPY yarn.lock* ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Criar pasta public se não existir
RUN mkdir -p public

# Build da aplicação
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários do build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ajustar permissões
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
