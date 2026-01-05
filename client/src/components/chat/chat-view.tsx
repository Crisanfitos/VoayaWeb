"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, TravelBrief } from '@/types';
import { ApiService } from '@/services/api';
import { getUserIdFromCookie, getChatIdFromCookie } from '@/lib/cookies';
import Link from 'next/link';

type SearchCategory = 'flights' | 'hotels' | 'experiences';

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

const ChatView: React.FC<ChatViewProps> = ({
  onChatComplete,
  error,
  initialQuery,
  selectedCategories,
  initialMessages,
  initialStatus
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatComplete, setIsChatComplete] = useState(!!initialStatus && initialStatus === 'completed');
  const [internalInitialQuery, setInternalInitialQuery] = useState(initialQuery || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageSent = useRef(false);

  const userId = getUserIdFromCookie();
  const chatId = getChatIdFromCookie();

  useEffect(() => {
    const shouldShowComplete =
      initialStatus &&
      (initialStatus === 'completed' ||
        initialStatus === 'finished' ||
        (initialStatus === 'active' && messages.length > 0));

    if (shouldShowComplete && !isChatComplete) {
      setIsChatComplete(true);
    }
  }, [initialStatus, messages.length, isChatComplete]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!userId || !chatId) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Error: No se pudo identificar tu sesión. Por favor, inicia sesión de nuevo."
      }]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await ApiService.sendMessage(chatId, text, userId);

      if (!response.message || typeof response.message.text !== 'string') {
        throw new Error('Invalid response structure from server');
      }

      const modelMessage: ChatMessage = {
        role: 'assistant',
        text: response.message.text
      };

      setMessages(prev => [...prev, modelMessage]);

      if (modelMessage.text.includes("ya tengo una base muy sólida para empezar a buscar")) {
        setIsChatComplete(true);
      }
    } catch (err) {
      console.error(`[ChatView] Error:`, err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo."
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, chatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
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
      const userMessage: ChatMessage = {
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
      try {
        await ApiService.completeChat(chatId);
      } catch (err) {
        console.error('[ChatView] Error completing chat:', err);
      }
    }
    window.location.href = '/plan';
  };

  const handleRestart = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setIsChatComplete(false);
    setInternalInitialQuery('');
  };

  const formatTime = (date?: Date) => {
    const d = date || new Date();
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)] bg-background-light dark:bg-background">
      {/* Chat Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-surface-dark border-b border-stroke dark:border-input-dark px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/chats" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-input-dark transition-colors">
              <span className="material-symbols-outlined text-text-secondary dark:text-text-muted">arrow_back</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-voaya-primary to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-main dark:text-white">Voaya AI</h1>
                <p className="text-xs text-text-secondary dark:text-text-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {isLoading ? 'Escribiendo...' : 'En línea'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-input-dark transition-colors text-text-secondary dark:text-text-muted">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 md:px-8 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{error}</p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message if no messages */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-voaya-primary/20 to-indigo-500/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-voaya-primary text-4xl">flight_takeoff</span>
              </div>
              <h2 className="text-xl font-bold text-text-main dark:text-white mb-2">
                ¡Hola! Soy tu asistente de viajes
              </h2>
              <p className="text-text-secondary dark:text-text-muted max-w-md">
                Cuéntame sobre tu próximo viaje. ¿A dónde te gustaría ir? ¿Cuándo? ¿Con quién?
              </p>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {['París en mayo', 'Playa con familia', 'Escapada romántica', 'Aventura en Asia'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark text-sm font-medium text-text-secondary dark:text-text-muted hover:border-voaya-primary hover:text-voaya-primary transition-colors shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Assistant Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voaya-primary to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`
                  max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl
                  ${msg.role === 'user'
                    ? 'bg-voaya-primary text-white rounded-br-md shadow-lg shadow-voaya-primary/20'
                    : 'bg-white dark:bg-surface-dark text-text-main dark:text-white rounded-bl-md shadow-md border border-stroke/50 dark:border-input-dark'
                  }
                `}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/60' : 'text-text-muted'}`}>
                  {formatTime()}
                </p>
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-input-dark flex items-center justify-center text-text-secondary dark:text-text-muted flex-shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-end gap-3 justify-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voaya-primary to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white dark:bg-surface-dark shadow-md border border-stroke/50 dark:border-input-dark rounded-bl-md">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-voaya-primary animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-voaya-primary animate-bounce [animation-delay:0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-voaya-primary animate-bounce [animation-delay:0.3s]"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white dark:bg-surface-dark border-t border-stroke dark:border-input-dark px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          {isChatComplete ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleRestart}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-input-dark text-text-main dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Reiniciar Chat
              </button>
              <button
                onClick={handleConfirm}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-voaya-primary text-white font-semibold hover:bg-voaya-primary-dark transition-colors shadow-lg shadow-voaya-primary/30"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Confirmar y Buscar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="w-full px-5 py-3.5 pr-12 bg-gray-100 dark:bg-input-dark text-text-main dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-voaya-primary focus:bg-white dark:focus:bg-surface-dark transition-all placeholder:text-text-muted"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-voaya-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">mood</span>
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 p-3.5 rounded-xl bg-voaya-primary text-white hover:bg-voaya-primary-dark disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
              >
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatView;
