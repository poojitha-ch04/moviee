import { useState, useEffect, useRef } from 'react';
import { Send, Users } from 'lucide-react';

const WatchPartyChat = ({ ws, user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!ws) return;
    
    // Add event listener to the existing WS
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setMessages(prev => [...prev, data]);
        }
      } catch (e) {
        // ignore
      }
    };
    
    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;
    
    const msgData = {
      type: 'chat',
      user: user?.username || 'Guest',
      message: input.trim()
    };
    ws.send(JSON.stringify(msgData));
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-t md:border-t-0 md:border-l border-white/10 w-full md:w-80 flex-shrink-0 h-[40vh] md:h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-red-950/20">
        <h3 className="font-bold flex items-center gap-2">
          <Users size={18} className="text-red-500" />
          Live Watch Party
        </h3>
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.user === user?.username ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-500 mb-1">{m.user}</span>
            <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${
              m.user === 'System' ? 'bg-white/5 text-gray-400 italic mx-auto text-center' :
              m.user === user?.username ? 'bg-red-600 text-white' : 'bg-white/10 text-white'
            }`}>
              {m.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chat..." 
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
        />
        <button type="submit" className="bg-red-600 p-2 rounded-lg text-white hover:bg-red-700 transition">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default WatchPartyChat;
