'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  createdAt: string;
  property?: { id: number; title: string } | null;
}

interface Conversation {
  userId: number;
  name: string;
  email: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

function MessagesContent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingPropertyId, setPendingPropertyId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    // Read ?userId and ?propertyId from URL (from "Message Owner" button)
    const urlUserId = searchParams.get('userId');
    const urlPropertyId = searchParams.get('propertyId');
    if (urlPropertyId) setPendingPropertyId(parseInt(urlPropertyId));
    fetchConversations(urlUserId ? parseInt(urlUserId) : null);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (autoOpenUserId: number | null = null) => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data.conversations || []);
      // Auto-open conversation if coming from property page
      if (autoOpenUserId) {
        openConversation(autoOpenUserId);
      }
    } catch { toast.error('Failed to load conversations'); }
    finally { setLoading(false); }
  };

  const openConversation = async (userId: number) => {
    setActiveUserId(userId);
    try {
      const { data } = await api.get(`/messages/${userId}`);
      setMessages(data.messages || []);
      // Mark as read
      fetchConversations();
    } catch { toast.error('Failed to load messages'); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeUserId || sending) return;
    setSending(true);
    try {
      const body: { content: string; propertyId?: number } = { content: input.trim() };
      if (pendingPropertyId) { body.propertyId = pendingPropertyId; }
      const { data } = await api.post(`/messages/${activeUserId}`, body);
      setMessages(prev => [...prev, data]);
      setInput('');
      setPendingPropertyId(null); // only attach on first message
      fetchConversations();
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  const activeConv = conversations.find(c => c.userId === activeUserId);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('messages.title')}</h1>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex" style={{ height: '70vh' }}>
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">{t('messages.conversation')}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">{t('messages.no_messages')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('messages.no_conversations_hint')}</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button key={conv.userId} onClick={() => openConversation(conv.userId)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeUserId === conv.userId ? 'bg-primary-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                      {conv.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">{conv.name ?? 'Unknown'}</p>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeUserId ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                  {activeConv?.name?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{activeConv?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-gray-400">{activeConv?.email ?? ''}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                        {msg.property && (
                          <Link href={`/properties/${msg.property.id}`}
                            className={`text-[10px] font-medium mb-1 block underline ${isMe ? 'text-primary-200' : 'text-primary-600'}`}>
                            Re: {msg.property.title}
                          </Link>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={t('messages.type_message')} disabled={sending}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  <button onClick={sendMessage} disabled={sending || !input.trim()}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">{t('messages.select')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('messages.select_hint')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}