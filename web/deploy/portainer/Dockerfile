# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments para variáveis de ambiente
ARG NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000/supabase
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY=build-only-placeholder
ARG NEXT_PUBLIC_SUPABASE_LOCAL_PROXY=0
ENV NEXT_PUBLIC_SUPABASE_LOCAL_PROXY=$NEXT_PUBLIC_SUPABASE_LOCAL_PROXY

# Converter ARG em ENV para o build do Next.js
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (usando npm install para atualizar lock se necessário)
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

