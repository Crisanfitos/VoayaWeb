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

      // Check if trip exists for this chat
      // We assume completeChat handles it if we force it? 
      // User requested: "check if exists another trip created... warn user... go to review or delete and create new"

      // We can use a new API endpoint or logic. For simplicity, let's just try to call a check endpoint.
      // Or we can rely on `completeChat` returning a specific code if exists. 
      // But user wants CLIENT side prompt.

      // Let's first check if there is an existing trip for this chat.
      // We can search trips by chatId.
      // Currently ApiService doesn't have `getTripByChatId` but filtering by generic `obtenerViajes` might work if it supports query.
      // Easier: Let's assume completeChat will return existing trip if we don't force. 
      // But the requirement is specific on UI prompt.

      // Let's implement check logic here if possible, or try completeChat and handle "AlreadyExists" error?
      // Since I can't easily change API signature without breaking things, I'll modify `completeChat` in backend to support a `checkOnly` flag or similar?
      // No, let's add `checkTripExists` to ApiService.

      // Actually backend `crearViajeDesdeChat` or `complete` logic: 
      // if I call `complete`, it creates a trip. If I do it again, it might duplicate or fail.

      // For now, I will implement a direct call to existing endpoint to check.
      // `ApiService.obtenerViajes` uses user ID. I can fetch all and find one with this chatId? Valid but slow.

      // Best approach: Add `/api/viajes/check-chat/:chatId` endpoint.
      // Since I am already in `chat.controller.ts`, I can add it, or `viaje.controller.ts`.

      // Wait, I can't add endpoints easily without viewing file again.
      // Let's try to complete, and if backend returns "trip already exists" (I need to implement this check in backend), then prompt.

      // But user asked: "check if exists... warn... go to review or delete and create new".
      // This implies 2 paths.

      // Use query param for force?
      // I'll update client to just call complete. If it returns `tripId`, I redirect.
      // To implement the "Ask user" feature properly, I need backend to tell me if it *would* overwrite.

      // Given constraints, I will fetch the trip associated with this chat if any.
      // I'll assume I can use `ApiService.obtenerViajes` filtering? No.

      // I'll implement a simplified version: Just call complete. 
      // IF the backend detects existing trip, it should return it.
      // I'll modify backend to handle `force` flag.

      await proceedWithCompletion();

    } catch (err) {
      console.error('Failed to complete chat', err);
    }
  };

  const proceedWithCompletion = async (forceRewrite = false) => {
    // Pass force flag if I add it to API
    const res: any = await ApiService.completeChat(chatId || '', forceRewrite);

    if (res.existingTrip && !forceRewrite) {
      setExistingTripId(res.existingTrip.id);
      setShowOverwritePrompt(true);
      return;
    }

    setChatStatus('completed');
    if (res.tripId) {
      router.push(`/my-trips/${res.tripId}`);
    }
  };

  if (showOverwritePrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-card-dark rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stroke dark:border-input-dark">
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
    <main className="min-h-screen bg-background-light dark:bg-background">
      <ChatView
        onChatComplete={handleChatComplete}
        error={null}
        initialMessages={messages}
        initialStatus={chatStatus}
        initialQuery={messages.length === 0 ? initialQuery : undefined}
        userId={getUserIdFromCookie() || undefined}
        chatId={chatId}
      />
    </main>
  );
}

