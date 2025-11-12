"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, TravelBrief } from '@/types';
import { ApiService } from '@/services/api';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ChatCompletionControls } from './chat-completion-controls';
import { getUserIdFromCookie, getChatIdFromCookie, saveChatIdToCookie } from '@/lib/cookies';

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

const ChatView: React.FC<ChatViewProps> = ({ onChatComplete, error, initialQuery, selectedCategories, initialMessages, initialStatus }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatComplete, setIsChatComplete] = useState(!!initialStatus && initialStatus === 'completed');
  const [internalInitialQuery, setInternalInitialQuery] = useState(initialQuery || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageSent = useRef(false);

  // Get userId and chatId from cookies
  const userId = getUserIdFromCookie();
  const chatId = getChatIdFromCookie();

  // Log initial status for debugging and detect if chat should show completion buttons
  useEffect(() => {
    console.log('[ChatView] Initialized with initialStatus:', initialStatus);
    console.log('[ChatView] Initial messages count:', messages.length);
    
    // Show completion buttons if:
    // 1. Status is 'completed' or 'finished', OR
    // 2. Status is 'active' and there are messages (chat has content)
    const shouldShowComplete = 
      initialStatus && 
      (initialStatus === 'completed' || 
       initialStatus === 'finished' || 
       (initialStatus === 'active' && messages.length > 0));
    
    console.log('[ChatView] shouldShowComplete:', shouldShowComplete);
    if (shouldShowComplete && !isChatComplete) {
      setIsChatComplete(true);
    }
  }, [initialStatus, messages.length, isChatComplete]);

  const sendMessage = useCallback(async (text: string) => {
    console.log(`[ChatView] sendMessage called with: "${text}"`);
    console.log(`[ChatView] userId: ${userId}, chatId: ${chatId}`);

    if (!userId || !chatId) {
      console.error('[ChatView] Missing userId or chatId from cookies');
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Error: No se pudo identificar tu sesión. Por favor, inicia sesión de nuevo."
      }]);
      return;
    }

    setIsLoading(true);

    try {
      console.log(`[ChatView] Calling ApiService.sendMessage...`);
      const response = await ApiService.sendMessage(chatId, text, userId);
      console.log(`[ChatView] Received response from API:`, response);

      if (!response.message || typeof response.message.text !== 'string') {
        console.error('[ChatView] Invalid response structure:', response);
        throw new Error('Invalid response structure from server');
      }

      const modelMessage: ChatMessage = {
        role: 'assistant',
        text: response.message.text
      };

      console.log(`[ChatView] Updating messages state with new message...`);
      setMessages(prev => {
        const newMessages = [...prev, modelMessage];
        console.log(`[ChatView] New messages state:`, newMessages);
        return newMessages;
      });

      // Check if chat should be marked as complete based on the assistant's message
      if (modelMessage.text.includes("ya tengo una base muy sólida para empezar a buscar")) {
        console.log(`[ChatView] Chat completion detected from Gemini response.`);
        setIsChatComplete(true);
      }
    } catch (err) {
      console.error(`[ChatView] Error calling API:`, err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo."
      }]);
    } finally {
      console.log(`[ChatView] sendMessage finished.`);
      setIsLoading(false);
    }
  }, [selectedCategories]);

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
    // Mark chat as completed before redirecting
    if (chatId) {
      try {
        console.log('[ChatView] Marking chat as completed...');
        await ApiService.completeChat(chatId);
        console.log('[ChatView] Chat marked as completed');
      } catch (err) {
        console.error('[ChatView] Error completing chat:', err);
      }
    }
    // Reload the planner page
    window.location.href = '/plan';
  };

  const handleRestart = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setIsChatComplete(false);
    setInternalInitialQuery('');
  };

  return (
    <div className="container max-w-4xl mx-auto flex flex-col min-h-[700px] bg-gradient-to-b from-white to-gray-50/80 rounded-3xl shadow-xl overflow-hidden border border-gray-100/80">
      <div className="py-8 px-8 bg-white border-b border-gray-100/80">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Tu próxima aventura te espera ✈️
            </h1>
            <p className="text-sm text-gray-500">Charlemos sobre tu próximo viaje</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100/80">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm text-gray-600 font-medium">Voaya está activa</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-8 py-3 bg-red-50 border-b border-red-100 text-red-600 text-center text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
          >
            {msg.role === 'assistant' && (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner flex-shrink-0 border-2 border-white">
                V
              </div>
            )}
            <div
              className={`
                group max-w-[80%] px-6 py-4 rounded-2xl transition-all duration-200
                ${msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-white text-gray-700 rounded-bl-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-gray-100'
                }
              `}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-end gap-4 justify-start animate-slideIn">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner flex-shrink-0 border-2 border-white">
              V
            </div>
            <div className="max-w-[80%] px-5 py-4 rounded-2xl bg-white shadow-md border border-gray-100 rounded-bl-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 bg-white border-t border-gray-100/80">
        {isChatComplete ? (
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleRestart}
              className="px-8 py-4 rounded-full bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 shadow-sm hover:shadow"
            >
              Reiniciar Chat
            </button>
            <button
              onClick={handleConfirm}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
            >
              Confirmar y Buscar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ej.: París, 2 personas, mayo..."
                className="w-full px-6 py-4 bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 placeholder:text-gray-400 shadow-sm hover:shadow-md"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatView;
