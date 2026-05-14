#!/bin/bash

# ============================================================================
# Script de Deploy Automático no Railway
# ============================================================================
# Este script automatiza o deploy do Bradesco Admin Panel no Railway
# Requisitos: Railway CLI instalado (npm install -g @railway/cli)
# ============================================================================

set -e

echo "🚀 Bradesco Admin Panel - Deploy Railway"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI não está instalado${NC}"
    echo "Instale com: npm install -g @railway/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI encontrado${NC}"
echo ""

# Fazer login no Railway
echo -e "${YELLOW}🔐 Fazendo login no Railway...${NC}"
railway login --browserless

echo ""
echo -e "${YELLOW}📦 Criando projeto no Railway...${NC}"

# Criar novo projeto
PROJECT_NAME="bradesco-admin-panel"
railway init --name "$PROJECT_NAME"

echo ""
echo -e "${YELLOW}🗄️  Adicionando MySQL...${NC}"

# Adicionar MySQL
railway add --service mysql

echo ""
echo -e "${YELLOW}🔧 Configurando variáveis de ambiente...${NC}"

# Gerar JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)

# Configurar variáveis
railway variables set NODE_ENV=production
railway variables set APP_NAME="Bradesco Admin Panel"
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set PORT=3000

echo ""
echo -e "${YELLOW}🚀 Fazendo deploy...${NC}"

# Deploy
railway up

echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "📊 Informações do Deploy:"
echo "========================"
railway status

echo ""
echo -e "${GREEN}🎉 Sua aplicação está online!${NC}"
echo ""
echo "Para acessar:"
echo "  railway open"
echo ""
echo "Para ver logs:"
echo "  railway logs"
echo ""
echo "Para gerenciar variáveis:"
echo "  railway variables"
echo ""

# ============================================================================
# Fim do script
# ============================================================================
