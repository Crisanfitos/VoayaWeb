import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Chat, Message } from '@shared/types/chat'; // Assuming shared types exist, or we define interface locally
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase/client';

// Use server API URL from env or default to localhost:3001
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

// Local interface if shared types don't match exact db structure
interface SupabaseMessage {
    id: string;
    contenido: string;
    rol: 'user' | 'assistant' | 'system';
    fecha_creacion: string;
    [key: string]: any;
}

export default function ChatContainer({ chatId }: { chatId?: string }) {
    // We map Supabase message structure to the component's expected Message interface
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const [localChatId, setLocalChatId] = useState<string | undefined>(chatId);
    const [chatStatus, setChatStatus] = useState<string | null>(null);
    const [chatMetadata, setChatMetadata] = useState<Record<string, any> | null>(null);

    useEffect(() => {
        const cid = localChatId;
        if (!cid || !user) return;

        // Fetch initial messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('mensajes')
                .select('*')
                .eq('chat_id', cid)
                .order('fecha_creacion', { ascending: true });

            if (data) {
                const mappedMessages: Message[] = data.map((msg: SupabaseMessage) => ({
                    id: msg.id,
                    chatId: cid,
                    text: msg.contenido,
                    role: msg.rol,
                    createdAt: msg.fecha_creacion,
                    userId: msg.usuario_id
                }));
                setMessages(mappedMessages);
            }
        };

        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat_messages:${cid}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensajes',
                    filter: `chat_id=eq.${cid}`
                },
                (payload: any) => {
                    const newMsg = payload.new as SupabaseMessage;
                    const mappedMsg: Message = {
                        id: newMsg.id,
                        chatId: cid,
                        text: newMsg.contenido,
                        role: newMsg.rol,
                        createdAt: newMsg.fecha_creacion,
                        userId: newMsg.usuario_id
                    };
                    setMessages((prev) => [...prev, mappedMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [localChatId, user]);

    // Subscribe to chat document to read status and metadata
    useEffect(() => {
        const cid = localChatId;
        if (!cid || !user) return;

        // Fetch initial status
        const fetchChatStatus = async () => {
            const { data } = await supabase
                .from('chats')
                .select('estado, metadatos')
                .eq('id', cid)
                .single();
            if (data) {
                setChatStatus(data.estado);
                setChatMetadata(data.metadatos);
            }
        };
        fetchChatStatus();

        // Subscribe to changes
        const channel = supabase
            .channel(`chat_status:${cid}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chats',
                    filter: `id=eq.${cid}`
                },
                (payload: any) => {
                    const newData = payload.new as any;
                    setChatStatus(newData.estado || null);
                    setChatMetadata(newData.metadatos || null);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [localChatId, user]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputMessage.trim() || !user || isLoading) return;

        setIsLoading(true);
        try {
            let cid = localChatId;
            // If there is no chat yet, create it via server
            if (!cid) {
                const resp = await fetch(`${SERVER_URL}/api/chat/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, categories: [] })
                });
                const body = await resp.json();
                cid = body.chatId;
                setLocalChatId(cid);
                // Update URL to include chatId if route expects it
                try {
                    router.replace(`/chats/${cid}`);
                } catch { }
            }

            // Send message to server to be saved (and processed by AI)
            await fetch(`${SERVER_URL}/api/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: cid, text: inputMessage.trim(), userId: user.id })
            });

            setInputMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestartChat = async () => {
        if (!user) return;
        try {
            const resp = await fetch(`${SERVER_URL}/api/chat/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, categories: [] })
            });
            const body = await resp.json();
            const newId = body.chatId;
            setLocalChatId(newId);
            setMessages([]);
            setChatStatus('active');
            setChatMetadata(null);
            try { router.replace(`/chats/${newId}`); } catch { }
        } catch (err) {
            console.error('Failed to restart chat', err);
        }
    };

    const handleConfirmAndSend = async () => {
        if (!localChatId) return;
        try {
            await fetch(`${SERVER_URL}/api/chat/send-external`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: localChatId })
            });
            // Optionally show confirmation to user
        } catch (err) {
            console.error('Failed to send to external webhook', err);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                                }`}
                        >
                            {message.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* If chat is completed show restart and confirm buttons */}
            {chatStatus === 'completed' && (
                <div className="p-4 border-t flex space-x-4">
                    <button onClick={handleRestartChat} className="px-4 py-2 bg-gray-200 rounded-lg">Reiniciar chat</button>
                    <button onClick={handleConfirmAndSend} className="px-4 py-2 bg-green-600 text-white rounded-lg">Confirmar y enviar</button>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex space-x-4">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 p-2 border rounded-lg"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                    >
                        Enviar
                    </button>
                </div>
            </form>
        </div>
    );
}
