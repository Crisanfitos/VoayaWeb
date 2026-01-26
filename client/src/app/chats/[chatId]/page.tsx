"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ChatView from '@/components/chat/chat-view';
import { ApiService } from '@/services/api';
import { getUserIdFromCookie, saveChatIdToCookie } from '@/lib/cookies';
import { ChatMessage, TravelBrief } from '@/types';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';

export default function ChatPage() {
  const params = useParams() as { chatId?: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = params?.chatId;
  const initialQuery = searchParams?.get('initialQuery') || undefined;

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

  const [showOverwritePrompt, setShowOverwritePrompt] = useState(false);
  const [existingTripId, setExistingTripId] = useState<string | null>(null);

  const handleChatComplete = async (brief: TravelBrief) => {
    try {
      if (!chatId) return;

      // STEP 1: Check if trip already exists (no side effects)
      const checkResult = await ApiService.checkTripExists(chatId);

      if (checkResult.exists && checkResult.trip) {
        // Show overwrite prompt - do NOT call /complete yet
        setExistingTripId(checkResult.trip.id);
        setShowOverwritePrompt(true);
        return;
      }

      // STEP 2: No existing trip, proceed with creation
      await proceedWithCompletion(false);

    } catch (err) {
      console.error('Failed to complete chat', err);
    }
  };

  const proceedWithCompletion = async (forceRewrite = false) => {
    try {
      const res: any = await ApiService.completeChat(chatId || '', forceRewrite);

      setChatStatus('completed');
      if (res.tripId) {
        router.push(`/my-trips/${res.tripId}`);
      }
    } catch (err) {
      console.error('Failed to proceed with completion', err);
    }
  };

  if (showOverwritePrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stroke dark:border-input-dark">
          <h3 className="text-xl font-bold mb-2 text-text-main dark:text-white">¡Ya existe un viaje!</h3>
          <p className="text-text-secondary dark:text-text-muted mb-6">
            Este chat ya tiene un viaje asociado. ¿Qué quieres hacer?
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/my-trips/${existingTripId}`)}
              className="w-full py-3 px-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl font-bold text-text-main dark:text-white transition-colors"
            >
              Ver viaje existente
            </button>
            <button
              onClick={() => { setShowOverwritePrompt(false); proceedWithCompletion(true); }}
              className="w-full py-3 px-4 bg-voaya-primary text-white hover:bg-voaya-primary-dark rounded-xl font-bold transition-colors"
            >
              Sobreescribir y crear nuevo
            </button>
            <button
              onClick={() => setShowOverwritePrompt(false)}
              className="mt-2 text-sm text-text-muted hover:text-text-main dark:hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }


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
    <>
      <ChatView
        onChatComplete={handleChatComplete}
        error={null}
        initialMessages={messages}
        initialStatus={chatStatus}
        initialQuery={messages.length === 0 ? initialQuery : undefined}
        userId={getUserIdFromCookie() || undefined}
        chatId={chatId}
      />
    </>
  );
}

