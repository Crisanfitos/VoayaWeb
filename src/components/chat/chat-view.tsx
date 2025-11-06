'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { travelPlannerFlow } from '@/ai/flows/travel-planner-flow';
import type { TravelPlannerInput } from '@/ai/flows/travel-planner-flow';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: any;
}

interface ChatViewProps {
  chatId: string;
}

export function ChatView({ chatId }: ChatViewProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
  }, [firestore, chatId]);

  const { data: messages, isLoading } = useCollection<Message>(messagesQuery);
  
  useEffect(() => {
    if (messages && messages.length > 0 && messages[messages.length - 1].role === 'user' && !isThinking) {
      const getAiResponse = async () => {
        setIsThinking(true);
        try {
          const chatHistory = messages.map(m => ({ role: m.role, text: m.text })) as TravelPlannerInput['history'];
          
          const response = await travelPlannerFlow({ history: chatHistory });
          
          if (response.reply && firestore) {
            const messagesCollectionRef = collection(firestore, `chats/${chatId}/messages`);
            addDocumentNonBlocking(messagesCollectionRef, {
              text: response.reply,
              role: 'assistant',
              createdAt: serverTimestamp(),
            });
          }
        } catch (error) {
          console.error("Error getting AI response:", error);
           if (firestore) {
             const messagesCollectionRef = collection(firestore, `chats/${chatId}/messages`);
             addDocumentNonBlocking(messagesCollectionRef, {
                text: "Lo siento, he encontrado un error y no puedo responder en este momento.",
                role: 'assistant',
                createdAt: serverTimestamp(),
             });
           }
        } finally {
          setIsThinking(false);
        }
      };
      getAiResponse();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, chatId, firestore]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !firestore || !user) return;

    const text = newMessage;
    setNewMessage('');

    const messagesCollectionRef = collection(firestore, `chats/${chatId}/messages`);
    const messageData = {
      text,
      role: 'user',
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(messagesCollectionRef, messageData);
  };

  return (
    <div className="flex justify-center items-start p-4 h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-3xl h-full flex flex-col shadow-lg">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && <div className="flex justify-center"><Loader /></div>}
          {messages?.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg p-3 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="max-w-lg p-3 rounded-lg bg-muted">
                <Loader />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1"
              disabled={isThinking}
            />
            <Button type="submit" disabled={!newMessage.trim() || isThinking}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
