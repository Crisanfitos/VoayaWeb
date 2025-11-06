
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

  

  const handleSendMessage = async (e: React.FormEvent) => {
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
      handleSendMessage(initialQuery);
    } else {
      // Mensaje de bienvenida estándar
      setMessages([
        { role: 'model', text: "¡Hola! Soy Voaya. Describe el viaje de tus sueños y te ayudaré a planificarlo. Por ejemplo: 'Un viaje a Japón para 3 personas en verano'" }
      ]);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
    setInput('');
  };

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
      <ChatHeader />
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/50 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-center">
          {error}
        </div>
      )}
      <ChatMessages messages={messages} isLoading={isLoading} ref={messagesEndRef} />
      
      <div className="p-4 border-t border-[#c4b5a0] bg-[#f5f0e8]">
        {isChatComplete ? (
          <ChatCompletionControls onRestart={handleRestart} onConfirm={handleConfirm} />
        ) : (
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ChatView;
