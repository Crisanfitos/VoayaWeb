"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChatSession } from "@google/generative-ai";
import { TravelBrief } from "@/types";

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  metadata?: {
    categories?: string[];
  };
}
import { startChatSession, sendMessageToServer } from "@/services/geminiService";
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ChatCompletionControls } from './chat-completion-controls';

type SearchCategory = 'flights' | 'hotels' | 'experiences';

interface ChatViewProps {
  onChatComplete: (brief: TravelBrief) => void;
  error: string | null;
  initialQuery?: string;
  selectedCategories?: Set<SearchCategory>;
}

const ChatView: React.FC<ChatViewProps> = ({ onChatComplete, error, initialQuery, selectedCategories }) => {
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatComplete, setIsChatComplete] = useState(false);
  const [internalInitialQuery, setInternalInitialQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const sendInitialMessage = async (message: string, session: ChatSession) => {
    setIsLoading(true);

    // Preparar el mensaje con las categorías seleccionadas
    const categories = selectedCategories ? Array.from(selectedCategories) : [];
    const categoriesContext = categories.length > 0
      ? `[Categorías seleccionadas: ${categories.join(', ')}] `
      : '';

    const initialMessage: ChatMessage = {
      role: 'user',
      text: message,
      metadata: { categories: categories as string[] }
    };
    setMessages([initialMessage]);

    try {
      // Enviar mensaje con el contexto de las categorías
      const response = await session.sendMessage({
        message: `${categoriesContext}${message}`
      });
      const modelMessageText = response.text;
      const modelMessage: ChatMessage = { role: 'model', text: modelMessageText };
      setMessages([initialMessage, modelMessage]);

      if (modelMessageText.includes("ya tengo una base muy sólida para empezar a buscar")) {
        setIsChatComplete(true);
      }
    } catch (err) {
      console.error(err);
      setMessages([initialMessage, { role: 'model', text: "Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chat) return;

    const categories = selectedCategories ? Array.from(selectedCategories) : [];
    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      metadata: { categories: categories as string[] }
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    if (!internalInitialQuery) {
      setInternalInitialQuery(input);
    }

    setIsLoading(true);
    setInput('');

    try {
      const categoriesContext = categories.length > 0
        ? `[Categorías seleccionadas: ${categories.join(', ')}] `
        : '';
      const response = await chat.sendMessage({
        message: `${categoriesContext}${input}`
      });
      const modelMessageText = response.text;
      const modelMessage: ChatMessage = { role: 'model', text: modelMessageText };
      setMessages([...newMessages, modelMessage]);

      if (modelMessageText.includes("ya tengo una base muy sólida para empezar a buscar")) {
        setIsChatComplete(true);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'model', text: "Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const categories = selectedCategories ? Array.from(selectedCategories) : [];
    const chatSession = startChatSession(categories);
    setChat(chatSession);

    // Si recibimos el 'initialQuery' de la página principal...
    if (initialQuery) {
      setInternalInitialQuery(initialQuery); // Guardamos el 'initialQuery' de la prop en el estado
      // Enviamos el mensaje inicial
      sendInitialMessage(initialQuery, chatSession)
    } else {
      // Mensaje de bienvenida estándar
      setMessages([
        { role: 'model', text: "¡Hola! Soy Voaya. Describe el viaje de tus sueños y te ayudaré a planificarlo. Por ejemplo: 'Un viaje a Japón para 3 personas en verano'" }
      ]);
    }
  }, [initialQuery]);

  const handleConfirm = () => {
    onChatComplete({
      initialQuery: internalInitialQuery || messages.find(m => m.role === 'user')?.text || '',
      chatHistory: messages
    });
  };

  const handleRestart = () => {
    setMessages([
      { role: 'model', text: "¡Hola! Soy Voaya. Describe el viaje de tus sueños y te ayudaré a planificarlo. Por ejemplo: 'Un viaje a Japón para 3 personas en verano'" }
    ]);
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
            {msg.role === 'model' && (
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
