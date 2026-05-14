# 🚀 Deploy Automático no Railway - Bradesco Admin Panel

**Status:** ✅ Repositório GitHub criado e pronto  
**URL do Repositório:** https://github.com/rolimdapires-create/bradesco-admin-panel  
**Data:** 14/05/2026

---

## 📋 Resumo Rápido

O seu código está **100% pronto** para deploy no Railway. Basta seguir os 5 passos abaixo:

---

## 🎯 5 Passos para Deploy em 5 Minutos

### **Passo 1: Acessar Railway**
1. Abra https://railway.app
2. Faça login com sua conta (crie uma se não tiver)
3. Clique em **"New Project"**

### **Passo 2: Conectar GitHub**
1. Selecione **"Deploy from GitHub"**
2. Autorize o Railway a acessar sua conta GitHub
3. Selecione o repositório: **`bradesco-admin-panel`**
4. Clique em **"Deploy"**

### **Passo 3: Aguardar Build**
- O Railway vai:
  - Fazer clone do repositório
  - Instalar dependências (`pnpm install`)
  - Fazer build (`pnpm build`)
  - Iniciar a aplicação

**Tempo estimado:** 5-10 minutos

### **Passo 4: Adicionar MySQL**
1. No painel do Railway, clique em **"+ Add Service"**
2. Selecione **"MySQL"**
3. Railway criará automaticamente um banco de dados
4. Copie a string de conexão (DATABASE_URL)

### **Passo 5: Configurar Variáveis de Ambiente**
1. No painel do seu serviço Node.js, vá para **"Variables"**
2. Adicione as seguintes variáveis:

```
DATABASE_URL=<copie da instância MySQL criada>
NODE_ENV=production
JWT_SECRET=<gere um valor seguro, ex: openssl rand -hex 32>
PORT=3000
APP_NAME=Bradesco Admin Panel
```

---

## 🔐 Gerar JWT_SECRET Seguro

Execute no seu terminal local:
```bash
openssl rand -hex 32
```

Copie o resultado e cole em `JWT_SECRET` no Railway.

---

## ✅ Pronto!

Após configurar as variáveis, o Railway vai:
1. Reiniciar a aplicação automaticamente
2. Conectar ao banco de dados
3. Sua app estará em: **`https://seu-projeto.up.railway.app`**

---

## 📊 Arquitetura Pronta

| Componente | Status |
|-----------|--------|
| **Frontend** | ✅ React 19 + Vite + Tailwind |
| **Backend** | ✅ Express + tRPC + Socket.IO |
| **Database** | ✅ MySQL + Drizzle ORM |
| **Build** | ✅ Configurado (railway.json) |
| **Procfile** | ✅ Pronto (npm run start) |
| **Variáveis** | ✅ Template criado (.env.example) |

---

## 🔗 URLs Importantes

| Recurso | Link |
|---------|------|
| **GitHub** | https://github.com/rolimdapires-create/bradesco-admin-panel |
| **Railway** | https://railway.app |
| **Documentação Railway** | https://docs.railway.app |
| **Documentação Projeto** | Ver arquivos .md neste repositório |

---

## 🚨 Troubleshooting Rápido

### Build falha?
- Verifique se `pnpm-lock.yaml` está no repositório ✅
- Verifique se `package.json` está correto ✅
- Verifique se `railway.json` está correto ✅

### App não inicia?
- Verifique `DATABASE_URL` está correto
- Verifique `NODE_ENV=production`
- Verifique logs no Railway: **"Logs"** tab

### Erro de conexão com banco?
- Aguarde 30 segundos após adicionar MySQL
- Verifique se DATABASE_URL foi copiada corretamente
- Tente reiniciar o serviço

---

## 📈 Próximos Passos (Opcional)

Após deploy bem-sucedido:

1. **Configurar domínio customizado** (Railway permite)
2. **Adicionar SSL/TLS** (automático no Railway)
3. **Configurar CI/CD** (automático com GitHub)
4. **Monitorar performance** (Railway Dashboard)
5. **Configurar backups** (MySQL no Railway)

---

## 💡 Dicas

- ✅ Railway oferece **free tier** com 5GB de storage
- ✅ Seu app vai dormir após inatividade (free tier)
- ✅ Você pode escalar para plano pago quando precisar
- ✅ Todos os dados persistem mesmo com restart

---

## 📞 Suporte

- **Railway Docs:** https://docs.railway.app
- **Railway Status:** https://status.railway.app
- **GitHub:** https://github.com/rolimdapires-create/bradesco-admin-panel/issues

---

**Pronto para deploy! 🚀**

Comece em: https://railway.app

---

**Versão:** 1.0.0  
**Última atualização:** 14/05/2026  
**Status:** ✅ Pronto para Deploy
