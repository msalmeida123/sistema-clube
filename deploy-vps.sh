#!/bin/bash
# ================================================
# Deploy Sistema Clube - VPS
# Executa no VPS via SSH
# ================================================

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REGISTRY="ghcr.io"
GITHUB_USER="msalmeida123"
IMAGE_WEB="${REGISTRY}/${GITHUB_USER}/sistema-clube-web:latest"
IMAGE_APP="${REGISTRY}/${GITHUB_USER}/clube-associado:latest"
STACK_NAME="sistema-clube-web"

echo -e "${GREEN}🚀 Deploy Sistema Clube${NC}"
echo "========================================"

# ----------------------------------------
# 1. Login no GHCR (se necessário)
# ----------------------------------------
if ! docker pull ${IMAGE_WEB} > /dev/null 2>&1; then
  echo -e "${YELLOW}🔐 Login necessário no GitHub Container Registry${NC}"
  echo "Gere um PAT em: https://github.com/settings/tokens"
  echo "Permissão necessária: read:packages"
  echo ""
  
  if [ -n "$GITHUB_PAT" ]; then
    echo "Usando GITHUB_PAT do ambiente..."
    echo "$GITHUB_PAT" | docker login ${REGISTRY} -u ${GITHUB_USER} --password-stdin
  else
    read -sp "Cole seu GitHub PAT: " GITHUB_PAT
    echo ""
    echo "$GITHUB_PAT" | docker login ${REGISTRY} -u ${GITHUB_USER} --password-stdin
  fi
fi

# ----------------------------------------
# 2. Pull das imagens
# ----------------------------------------
echo -e "\n${GREEN}📦 Baixando imagens...${NC}"
docker pull ${IMAGE_WEB}
echo "✅ sistema-clube-web OK"

# Descomentar quando o app do associado estiver pronto:
# docker pull ${IMAGE_APP}
# echo "✅ clube-associado OK"

# ----------------------------------------
# 3. Deploy/Update da stack
# ----------------------------------------
echo -e "\n${GREEN}🚀 Aplicando stack...${NC}"

# Se o arquivo da stack existir localmente, usar ele
if [ -f "./docker-compose.swarm.yml" ]; then
  docker stack deploy -c ./docker-compose.swarm.yml ${STACK_NAME} --with-registry-auth
else
  # Stack inline como fallback
  cat > /tmp/sistema-clube-stack.yml << 'STACK'
version: '3.8'

services:
  sistema-clube:
    image: ghcr.io/msalmeida123/sistema-clube-web:latest
    deploy:
      mode: replicated
      replicas: 1
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.sistema-clube.rule=Host(`clube.mindforge.dev.br`)"
        - "traefik.http.routers.sistema-clube.entrypoints=websecure"
        - "traefik.http.routers.sistema-clube.tls.certresolver=letsencryptresolver"
        - "traefik.http.services.sistema-clube.loadbalancer.server.port=3000"
        - "traefik.docker.network=network_swarm_public"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=https://fkjjjpgxkjhqkhmdpmzk.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrampqcGd4a2pocWtobWRwbXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDI0NTYsImV4cCI6MjA4MjE3ODQ1Nn0.c0wUGT2Ah2RW5lPJ5EhS738349AdvXsnnsoQvNjM5PY
    networks:
      - network_swarm_public
    healthcheck:
      test: ["CMD-SHELL", "node -e \"fetch('http://localhost:3000').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))\""]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

networks:
  network_swarm_public:
    external: true
STACK

  docker stack deploy -c /tmp/sistema-clube-stack.yml ${STACK_NAME} --with-registry-auth
  rm -f /tmp/sistema-clube-stack.yml
fi

# ----------------------------------------
# 4. Verificar status
# ----------------------------------------
echo -e "\n${GREEN}📊 Status dos serviços:${NC}"
sleep 5
docker service ls | grep ${STACK_NAME}

echo -e "\n${GREEN}✅ Deploy concluído!${NC}"
echo "========================================"
echo -e "🌐 Web Admin:  https://clube.mindforge.dev.br"
echo -e "📱 App Sócio:  https://app.mindforge.dev.br (quando disponível)"
echo ""
echo "Comandos úteis:"
echo "  docker service logs ${STACK_NAME}_sistema-clube -f"
echo "  docker service ps ${STACK_NAME}_sistema-clube"
echo "  docker service update --force ${STACK_NAME}_sistema-clube"
