
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChatSession } from "@google/genai";
import { ChatMessage, TravelBrief } from "@/types";
import { startChatSession, sendMessageToServer } from "@/services/geminiService";
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ChatCompletionControls } from './chat-completion-controls';

interface ChatViewProps {
  onChatComplete: (brief: TravelBrief) => void;
  error: string | null;
  initialQuery?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ onChatComplete, error, initialQuery }) => {
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatComplete, setIsChatComplete] = useState(false);
  const [internalInitialQuery, setInternalInitialQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  
  const sendInitialMessage = async (message: string, session: ChatSession) => {
    setIsLoading(true);
    const initialMessage: ChatMessage = { role: 'user', text: message };
    setMessages([initialMessage]);

    try {
      const response = await session.sendMessage({ message: message });
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

    const userMessage: ChatMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    if (!internalInitialQuery) {
      setInternalInitialQuery(input);
    }

    setIsLoading(true);
    setInput('');

    try {
      const response = await chat.sendMessage({ message: input });
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
    const chatSession = startChatSession();
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
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[90vh] bg-[#f5f0e8] rounded-2xl shadow-2xl overflow-hidden border border-[#c4b5a0]">
      <div className="p-4 border-b border-[#c4b5a0] bg-[#d4a574] text-center">
        <h1 className="text-2xl font-bold text-[#f5f0e8]">Tu Próxima Aventura te Espera ✈️</h1>
        <p className="text-[#f5f0e8]">Describe el viaje de tus sueños y deja que me encargue del resto.</p>
      </div>
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/50 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-center">
          {error}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a574] to-[#c89550] flex items-center justify-center text-[#f5f0e8] font-bold text-lg flex-shrink-0">V</div>
            )}
            <div className={`max-w-md lg:max-w-lg p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[#c89550] text-[#f5f0e8] rounded-br-none' : 'bg-[#f5f0e8] text-[#3d3d3d] border border-[#c4b5a0] rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-3 justify-start">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">V</div>
            <div className="max-w-md lg:max-w-lg p-4 rounded-2xl bg-slate-200 dark:bg-slate-700 rounded-bl-none">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-[#c4b5a0] bg-[#f5f0e8]">
        {isChatComplete ? (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-full bg-[#f5f0e8] border border-[#c89550] text-[#c89550] font-semibold hover:bg-[#c89550] hover:text-[#f5f0e8] transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c89550]">
              Reiniciar Chat
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-3 rounded-full bg-[#c89550] text-[#f5f0e8] font-semibold hover:bg-[#d4a574] transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c89550]">
              Confirmar y Buscar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., París, 2 personas, Mayo..."
              className="flex-1 w-full px-4 py-3 bg-[#f5f0e8] border border-[#c4b5a0] text-[#3d3d3d] rounded-full focus:outline-none focus:ring-2 focus:ring-[#c89550] transition placeholder-[#6b5d4f]"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="p-3 rounded-full bg-[#c89550] text-[#f5f0e8] hover:bg-[#d4a574] disabled:bg-[#c4b5a0] disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#c89550]">
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
