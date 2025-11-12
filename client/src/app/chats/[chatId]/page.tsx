"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatView from '@/components/chat/chat-view';
import { ApiService } from '@/services/api';
import { getUserIdFromCookie, saveChatIdToCookie } from '@/lib/cookies';
import { ChatMessage, TravelBrief } from '@/types';

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

    // Save chatId to cookie so ChatView and other parts can use it
    saveChatIdToCookie(chatId);

    const load = async () => {
      setLoading(true);
      try {
        const res: any = await ApiService.getChat(chatId);
        console.log('[ChatPage] Loaded chat data:', res?.chat);
        console.log('[ChatPage] Chat status:', res?.chat?.status);
        console.log('[ChatPage] Number of messages:', res?.messages?.length);
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
    return <div className="flex items-center justify-center min-h-screen">Cargando chat…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="py-8 md:py-12 min-h-screen bg-gray-50/50">
      <ChatView
        onChatComplete={handleChatComplete}
        error={null}
        initialMessages={messages}
        initialStatus={chatStatus}
        userId={getUserIdFromCookie() || undefined}
        chatId={chatId}
      />
    </div>
  );
}
