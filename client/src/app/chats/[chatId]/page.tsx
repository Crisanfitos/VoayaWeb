"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatView from '@/components/chat/chat-view';
import { ApiService } from '@/services/api';
import { getUserIdFromCookie, saveChatIdToCookie } from '@/lib/cookies';
import { ChatMessage, TravelBrief } from '@/types';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';

export default function ChatPage() {
  const params = useParams() as { chatId?: string };
  const router = useRouter();
  const chatId = params?.chatId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!chatId) {
      router.push('/chats');
      return;
    }

    saveChatIdToCookie(chatId);

    const load = async () => {
      setLoading(true);
      try {
        const res: any = await ApiService.getChat(chatId);
        setMessages(res?.messages || []);
        setChatStatus(res?.chat?.status);
      } catch (err: any) {
        console.error('Failed to load chat', err);
        setError(err?.message || 'Error cargando chat');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [chatId, router]);

  const handleChatComplete = async (brief: TravelBrief) => {
    try {
      await ApiService.completeChat(chatId || '');
      setChatStatus('completed');
    } catch (err) {
      console.error('Failed to complete chat', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background gap-4">
        <Loader />
        <p className="text-text-secondary dark:text-text-muted">Cargando conversación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-main dark:text-white mb-2">Error al cargar</h2>
          <p className="text-text-secondary dark:text-text-muted mb-4">{error}</p>
          <Link
            href="/chats"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-voaya-primary text-white font-medium hover:bg-voaya-primary-dark transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver a chats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background-light dark:bg-background">
      <ChatView
        onChatComplete={handleChatComplete}
        error={null}
        initialMessages={messages}
        initialStatus={chatStatus}
        userId={getUserIdFromCookie() || undefined}
        chatId={chatId}
      />
    </main>
  );
}

