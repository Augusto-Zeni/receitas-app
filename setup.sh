#!/bin/bash
set -e

# =============================================================================
# setup.sh — Inicialização da VM para apresentação
# Uso: GITHUB_PAT=<seu_token> bash setup.sh
# O GITHUB_PAT precisa ter permissão "Administration" (fine-grained)
# ou "repo" (classic token)
# =============================================================================

REPO_URL="https://github.com/Augusto-Zeni/receitas-app.git"
REPO_OWNER="Augusto-Zeni"
REPO_NAME="receitas-app"
PROJECT_DIR="/home/univates/receitas-app"
RUNNER_CONTAINER="github-runner"
RUNNER_IMAGE="myoung34/github-runner:latest"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERRO]${NC} $1"; exit 1; }

# Extrai um campo JSON
json_field() {
  local field="$1"
  grep -o "\"${field}\":[[:space:]]*\"[^\"]*\"" | head -1 | sed "s/\"${field}\":[[:space:]]*\"//;s/\"$//"
}

# --- Validações iniciais ---
[ -z "$GITHUB_PAT" ] && error "Variável GITHUB_PAT não definida. Execute: GITHUB_PAT=<token> bash setup.sh"
command -v docker &>/dev/null || error "Docker não está instalado."
command -v git    &>/dev/null || error "Git não está instalado."

# --- 1. Clonar o projeto se necessário ---
if [ -d "$PROJECT_DIR/.git" ]; then
  info "Projeto já clonado em $PROJECT_DIR. Atualizando..."
  git -C "$PROJECT_DIR" fetch origin
  git -C "$PROJECT_DIR" reset --hard origin/develop
else
  info "Clonando projeto em $PROJECT_DIR..."
  git clone "$REPO_URL" "$PROJECT_DIR"
fi

# --- 2. Subir o runner como container se não estiver rodando ---
if sudo docker ps --format '{{.Names}}' | grep -q "^${RUNNER_CONTAINER}$"; then
  info "Runner '$RUNNER_CONTAINER' já está em execução."
else
  info "Obtendo token de registro do runner..."

  API_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $GITHUB_PAT" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runners/registration-token")

  HTTP_CODE=$(echo "$API_RESPONSE" | tail -1)
  RESPONSE_BODY=$(echo "$API_RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" != "201" ]; then
    echo ""
    error "API do GitHub retornou HTTP $HTTP_CODE: $RESPONSE_BODY"
  fi

  RUNNER_TOKEN=$(echo "$RESPONSE_BODY" | json_field "token")

  [ -z "$RUNNER_TOKEN" ] && error "Token não encontrado na resposta: $RESPONSE_BODY"

  info "Token obtido com sucesso."

  # Remover container antigo/parado com mesmo nome se existir
  if sudo docker ps -a --format '{{.Names}}' | grep -q "^${RUNNER_CONTAINER}$"; then
    warn "Removendo container antigo '$RUNNER_CONTAINER'..."
    sudo docker rm -f "$RUNNER_CONTAINER"
  fi

  info "Baixando imagem do runner (pode demorar na primeira vez)..."
  sudo docker pull "$RUNNER_IMAGE"

  info "Subindo runner como container Docker..."
  sudo docker run -d \
    --name "$RUNNER_CONTAINER" \
    --restart unless-stopped \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$PROJECT_DIR:$PROJECT_DIR" \
    -e RUNNER_NAME="vm-univates-runner" \
    -e RUNNER_TOKEN="$RUNNER_TOKEN" \
    -e REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}" \
    -e LABELS="self-hosted" \
    -e RUNNER_WORKDIR="/tmp/runner-work" \
    "$RUNNER_IMAGE"

  info "Aguardando runner registrar no GitHub (30s)..."
  sleep 30
fi

# --- Resumo ---
echo ""
info "Setup concluído!"
echo "  Projeto : $PROJECT_DIR"
RUNNER_STATUS=$(sudo docker inspect -f '{{.State.Status}}' "$RUNNER_CONTAINER" 2>/dev/null || echo 'desconhecido')
echo "  Runner  : container '$RUNNER_CONTAINER' ($RUNNER_STATUS)"
echo ""
warn "Confirme o runner em: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/actions/runners"
