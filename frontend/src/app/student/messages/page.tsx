'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

interface Conversation {
  id_conversation: number;
  created_at: string;
  updated_at: string;
  offer: { id_offer: number; title: string };
  company: { id_company: number; company_name: string; logo_url?: string };
  messages: { content: string; sent_at: string; is_read: boolean }[];
}

interface Message {
  id_message: number;
  content: string;
  is_read: boolean;
  sent_at: string;
  sender: { id_user: number; nom: string; prenom: string };
}

export default function StudentMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/conversations/student/2'); // id_student
        setConversations(res.data);
      } catch {
        console.error('Erreur fetch conversations');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const openConversation = async (conv: Conversation) => {
    setSelected(conv);
    try {
      const res = await api.get(`/messages/conversation/${conv.id_conversation}`);
      setMessages(res.data);
    } catch {
      console.error('Erreur fetch messages');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selected) return;
    setSending(true);
    try {
      await api.post('/messages', {
        content: newMessage,
        id_conversation: selected.id_conversation,
        id_sender: 2, // id_user du student
      });
      setNewMessage('');
      const res = await api.get(`/messages/conversation/${selected.id_conversation}`);
      setMessages(res.data);
    } catch {
      console.error('Erreur send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Messages</h1>
        <p className="text-sm text-gray-500">Échangez avec les entreprises.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-white border border-gray-100 rounded-xl overflow-hidden" style={{ height: '600px' }}>
        {/* Conversations list */}
        <div className="border-r border-gray-100 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-400">Chargement...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              <i className="ti ti-message text-3xl text-gray-300 mb-2 block"></i>
              Aucune conversation.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id_conversation}
                onClick={() => openConversation(conv)}
                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${
                  selected?.id_conversation === conv.id_conversation ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                    {conv.company.company_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 truncate">{conv.company.company_name}</h4>
                    <p className="text-xs text-gray-400 truncate">{conv.offer.title}</p>
                  </div>
                </div>
                {conv.messages[0] && (
                  <p className="text-xs text-gray-400 truncate ml-12">{conv.messages[0].content}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Chat window */}
        <div className="col-span-2 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Sélectionnez une conversation
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {selected.company.company_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">{selected.company.company_name}</h4>
                  <p className="text-xs text-gray-400">{selected.offer.title}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map((msg) => {
                  const isMe = msg.sender.id_user === 2;
                  return (
                    <div key={msg.id_message} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-xl text-sm ${
                          isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {msg.content}
                        <div className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {new Date(msg.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 p-4 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Écrire un message..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <i className="ti ti-send"></i>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}