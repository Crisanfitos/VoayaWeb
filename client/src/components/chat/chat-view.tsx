"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, TravelBrief } from '@/types';
import { ApiService } from '@/services/api';
import { getUserIdFromCookie, getChatIdFromCookie } from '@/lib/cookies';
import { ChatHeader } from './ChatHeader';
import { ChatWelcome } from './ChatWelcome';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInputForm } from './ChatInputForm';

type SearchCategory = 'flights' | 'hotels' | 'experiences';

// Extended message type with unique ID
interface ChatMessageWithId extends ChatMessage {
  id: string;
}

interface ChatViewProps {
  onChatComplete: (brief: TravelBrief) => void;
  error: string | null;
  initialQuery?: string;
  selectedCategories?: Set<SearchCategory>;
  userId?: string;
  chatId?: string;
  initialMessages?: ChatMessage[];
  initialStatus?: string;
}

// Generate unique ID for messages
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ChatView: React.FC<ChatViewProps> = ({
  onChatComplete,
  error,
  initialQuery,
  selectedCategories,
  initialMessages,
  initialStatus
}) => {
  const [messages, setMessages] = useState<ChatMessageWithId[]>(() =>
    (initialMessages || []).map(msg => ({ ...msg, id: generateMessageId() }))
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatComplete, setIsChatComplete] = useState(!!initialStatus && initialStatus === 'completed');
  const [internalInitialQuery, setInternalInitialQuery] = useState(initialQuery || '');
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const initialMessageSent = useRef(false);

  const userId = getUserIdFromCookie();
  const chatId = getChatIdFromCookie();

  useEffect(() => {
    const shouldShowComplete =
      initialStatus === 'completed' || initialStatus === 'finished';

    if (shouldShowComplete && !isChatComplete) {
      setIsChatComplete(true);
    }
  }, [initialStatus, isChatComplete]);

  useEffect(() => {
    messagesStartRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!userId || !chatId) {
      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        text: "Error: No se pudo identificar tu sesión. Por favor, inicia sesión de nuevo."
      }]);
      return;
    }

    setIsLoading(true);

    const assistantMessageId = generateMessageId();
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      text: ''
    }]);

    try {
      const reader = await ApiService.sendMessageStream(chatId, text, userId);
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setMessages(prev => {
          const newMessages = [...prev];
          const msgIndex = newMessages.findIndex(m => m.id === assistantMessageId);
          if (msgIndex !== -1) {
            newMessages[msgIndex] = { ...newMessages[msgIndex], text: fullText };
          }
          return newMessages;
        });
      }

      if (fullText.includes("ya tengo una base muy sólida para empezar a buscar")) {
        setIsChatComplete(true);
        ApiService.completeChat(chatId).catch(err =>
          console.error("[ChatView] Error al marcar chat como completado automáticamente:", err)
        );
      }
    } catch (err) {
      console.error(`[ChatView] Error:`, err);
      setMessages(prev => {
        const newMessages = [...prev];
        const msgIndex = newMessages.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1 && newMessages[msgIndex].text === '') {
          newMessages[msgIndex] = {
            ...newMessages[msgIndex],
            text: "Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo."
          };
        } else {
          newMessages.push({
            id: generateMessageId(),
            role: 'assistant',
            text: "\n(Error de conexión)"
          });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, chatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessageWithId = {
      id: generateMessageId(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    if (!internalInitialQuery) {
      setInternalInitialQuery(currentInput);
    }

    await sendMessage(currentInput);
  };

  useEffect(() => {
    if (initialQuery && !initialMessageSent.current) {
      const userMessage: ChatMessageWithId = {
        id: generateMessageId(),
        role: 'user',
        text: initialQuery
      };
      setMessages([userMessage]);
      setInternalInitialQuery(initialQuery);
      sendMessage(initialQuery);
      initialMessageSent.current = true;
    }
  }, [initialQuery, sendMessage]);

  const handleConfirm = async () => {
    if (chatId) {
      setIsLoading(true);
      try {
        await onChatComplete({} as TravelBrief); // Trigger parent completion logic
      } catch (err) {
        console.error('[ChatView] Error completing chat:', err);
        setIsLoading(false);
      }
      // Note: We don't set loading false on success because page will redirect or prompt
      // But if prompt appears, we might need to reset it? 
      // Actually `onChatComplete` in `page.tsx` sets `showOverwritePrompt`.
      // If prompt appears, `onChatComplete` returns.
      // So we should probably pass `isLoading` state management up? 
      // Or just let it spin until redirect.
      // If prompt shows, we need to stop spinning.

      // Since `onChatComplete` is async, we can wait.
      // If it throws or returns, we stop loading?
      // In `page.tsx`, `handleChatComplete` sets state.
      // We should probably rely on `isLoading` prop if it was lifted?
      // Currently `isLoading` is local to `ChatView`.

      // Let's safe-guard:
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setIsChatComplete(false);
    setInternalInitialQuery('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const formatTime = (date?: Date) => {
    const d = date || new Date();
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    // h-[calc(100vh-64px)] accounts for the main Navbar height (~64px)
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background-light dark:bg-background overflow-hidden relative">
      {/* Fixed Chat Header */}
      <div className="flex-none z-10 bg-background-light dark:bg-background">
        <ChatHeader isLoading={isLoading} />
        {/* Error Banner */}
        {error && (
          <div className="px-4 md:px-8 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col">
        <div className="max-w-4xl mx-auto w-full space-y-6 flex flex-col flex-1">
          {messages.length === 0 && !isLoading && (
            <ChatWelcome onSuggestionClick={handleSuggestionClick} />
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} formatTime={formatTime} />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={messagesStartRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="flex-none z-10 bg-background-light dark:bg-background pt-2">
        <ChatInputForm
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          isChatComplete={isChatComplete}
          onSubmit={handleSubmit}
          onRestart={handleRestart}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
};

export default ChatView;
