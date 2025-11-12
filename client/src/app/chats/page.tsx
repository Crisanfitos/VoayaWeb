
"use client";
import React, { useEffect, useState } from 'react';
import { getUserIdFromCookie, saveChatIdToCookie } from '@/lib/cookies';
import { ApiService } from '@/services/api';
import { useRouter } from 'next/navigation';

type ChatItem = {
  id: string;
  title?: string;
  status?: string;
  lastMessageAt?: any;
  metadata?: any;
};

const statusColors: Record<string, string> = {
  'En proceso': 'bg-yellow-100 text-yellow-800',
  'Finalizado': 'bg-green-100 text-green-800',
};

export default function ChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const userId = getUserIdFromCookie() || undefined;
        const res: any = await ApiService.getChats(userId);
        setChats(res?.chats || []);
      } catch (err: any) {
        console.error('Failed to load chats', err);
        setError(err?.message || 'Error cargando chats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Mis Chats</h1>

      {loading && <div className="text-gray-600">Cargando chats…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chats.length === 0 && (
            <div className="text-gray-600">No tienes chats todavía. Inicia una conversación desde el planificador.</div>
          )}

          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => {
                try {
                  saveChatIdToCookie(chat.id);
                } catch (e) {
                  console.error('Failed to save chatId cookie', e);
                }
                router.push(`/chats/${chat.id}`);
              }}
              className="text-left rounded-lg shadow-md bg-white p-6 flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{chat.title || 'Sin título'}</h2>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${statusColors[chat.status || 'Finalizado']}`}
                >
                  {chat.status || 'Finalizado'}
                </span>
              </div>
              <div className="mt-4 text-xs text-gray-500">ID: {chat.id}</div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
// ...existing code...
