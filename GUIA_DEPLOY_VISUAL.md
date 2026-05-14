# 📱 Guia Visual: Deploy no Railway em 5 Minutos

**Bradesco Admin Panel - Deploy Passo-a-Passo**

---

## 🎯 Resumo

- ✅ Código no GitHub: https://github.com/rolimdapires-create/bradesco-admin-panel
- ✅ Pronto para deploy no Railway
- ⏱️ Tempo total: ~10 minutos

---

## 📍 PASSO 1: Acessar Railway

**O que fazer:**
1. Abra https://railway.app
2. Clique em **"Sign Up"** ou **"Login"**
3. Escolha **"Continue with GitHub"** (mais fácil)

**Resultado esperado:**
- Você estará logado no Railway
- Verá o dashboard principal

---

## 📍 PASSO 2: Criar Novo Projeto

**O que fazer:**
1. Clique em **"New Project"** (botão azul no topo)
2. Selecione **"Deploy from GitHub"**

**Resultado esperado:**
- Você verá uma lista de repositórios GitHub

---

## 📍 PASSO 3: Selecionar Repositório

**O que fazer:**
1. Procure por **"bradesco-admin-panel"**
2. Clique nele para selecionar
3. Clique em **"Deploy"**

**Resultado esperado:**
- Railway começará a fazer build do projeto
- Você verá uma barra de progresso

---

## 📍 PASSO 4: Aguardar Build

**O que fazer:**
- Apenas aguarde! Railway está:
  - Instalando dependências (`pnpm install`)
  - Compilando código (`pnpm build`)
  - Preparando para produção

**Tempo estimado:** 5-10 minutos

**Resultado esperado:**
- Você verá "Build Successful" ✅
- A aplicação estará em estado "Running"

---

## 📍 PASSO 5: Adicionar MySQL

**O que fazer:**
1. No painel do Railway, clique em **"+ Add Service"**
2. Procure por **"MySQL"**
3. Clique em **"MySQL"** para adicionar

**Resultado esperado:**
- Uma nova instância MySQL será criada
- Você verá as credenciais do banco

---

## 📍 PASSO 6: Copiar DATABASE_URL

**O que fazer:**
1. Clique no serviço MySQL que foi criado
2. Vá para a aba **"Variables"**
3. Procure por **"DATABASE_URL"**
4. Clique no ícone de cópia para copiar a URL

**Resultado esperado:**
- Você tem a string de conexão do banco
- Exemplo: `mysql://user:pass@host:3306/db`

---

## 📍 PASSO 7: Configurar Variáveis do Node.js

**O que fazer:**
1. Clique no serviço Node.js (seu app)
2. Vá para a aba **"Variables"**
3. Adicione as seguintes variáveis:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Cole o valor copiado do MySQL |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Gere um valor seguro (veja abaixo) |
| `PORT` | `3000` |
| `APP_NAME` | `Bradesco Admin Panel` |

**Como gerar JWT_SECRET:**
- Abra terminal e execute:
  ```bash
  openssl rand -hex 32
  ```
- Copie o resultado e cole em `JWT_SECRET`

**Resultado esperado:**
- Todas as variáveis configuradas
- A aplicação vai reiniciar automaticamente

---

## 📍 PASSO 8: Aguardar Reinicialização

**O que fazer:**
- Apenas aguarde a aplicação reiniciar
- Você verá os logs atualizando

**Tempo estimado:** 1-2 minutos

**Resultado esperado:**
- Status muda para "Running" ✅
- Logs mostram servidor iniciando

---

## 📍 PASSO 9: Acessar Sua Aplicação

**O que fazer:**
1. No painel do Railway, clique em **"Open"** (ou veja a URL)
2. Você verá algo como: `https://seu-projeto.up.railway.app`
3. Clique para abrir

**Resultado esperado:**
- Sua aplicação está ONLINE! 🎉
- Você pode acessar:
  - `/` - Home page
  - `/cliente` - Página do cliente
  - `/admin` - Painel administrativo

---

## ✅ Checklist Final

- [ ] Repositório GitHub criado
- [ ] Projeto criado no Railway
- [ ] Build completado com sucesso
- [ ] MySQL adicionado
- [ ] DATABASE_URL configurada
- [ ] NODE_ENV = production
- [ ] JWT_SECRET configurado
- [ ] Aplicação reiniciada
- [ ] URL acessível

---

## 🚀 Próximos Passos (Opcional)

### Configurar Domínio Customizado
1. No Railway, vá para **"Settings"**
2. Clique em **"Add Custom Domain"**
3. Digite seu domínio (ex: bradesco.seu-dominio.com)
4. Configure DNS no seu registrador

### Monitorar Performance
1. Vá para **"Logs"** para ver logs em tempo real
2. Vá para **"Metrics"** para ver CPU, memória, etc.
3. Vá para **"Deployments"** para ver histórico

### Escalar (Plano Pago)
- Railway oferece plano pago para aplicações maiores
- Clique em **"Settings"** > **"Plan"** para upgrade

---

## 🆘 Troubleshooting Rápido

### "Build Failed"
**Solução:**
- Verifique se o repositório tem `package.json` ✅
- Verifique se tem `railway.json` ✅
- Verifique se tem `Procfile` ✅

### "Application Crashed"
**Solução:**
- Verifique `DATABASE_URL` está correto
- Verifique `NODE_ENV=production`
- Clique em **"Logs"** para ver o erro

### "Can't connect to database"
**Solução:**
- Aguarde 30 segundos após adicionar MySQL
- Copie DATABASE_URL novamente
- Reinicie o serviço

### "Port already in use"
**Solução:**
- Verifique se `PORT` está configurado como `3000`
- Railway define PORT automaticamente, não mude

---

## 📞 Suporte

- **Railway Docs:** https://docs.railway.app
- **Railway Support:** https://railway.app/support
- **GitHub Issues:** https://github.com/rolimdapires-create/bradesco-admin-panel/issues

---

## 🎉 Parabéns!

Sua aplicação está ONLINE e pronta para usar! 🚀

**URL:** `https://seu-projeto.up.railway.app`

---

**Versão:** 1.0.0  
**Última atualização:** 14/05/2026  
**Status:** ✅ Pronto para Deploy
