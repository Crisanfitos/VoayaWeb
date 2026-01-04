import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Chat, Message } from '@shared/types/chat';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    getFirestore,
    doc,
    DocumentData,
    DocumentSnapshot
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

// Use server API URL from env or default to localhost:3001
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

export default function ChatContainer({ chatId }: { chatId?: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const db = getFirestore();
    const [localChatId, setLocalChatId] = useState<string | undefined>(chatId);
    const [chatStatus, setChatStatus] = useState<string | null>(null);
    const [chatMetadata, setChatMetadata] = useState<Record<string, any> | null>(null);

    useEffect(() => {
        const cid = localChatId;
        if (!cid || !user) return;

        // Suscribirse a los mensajes del chat
        const messagesRef = collection(db, 'chats', cid, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];

            setMessages(newMessages);
        });

        // Limpiar suscripción al desmontar
        return () => unsubscribe();
    }, [localChatId, user]);

    // Subscribe to chat document to read status and metadata
    useEffect(() => {
        const cid = localChatId;
        if (!cid || !user) return;

        const chatRef = doc(db, 'chats', cid);
        const unsub = onSnapshot(chatRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data() as DocumentData;
            setChatStatus(data.status || null);
            setChatMetadata(data.metadata || null);
        });

        return () => unsub();
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

            // Send message to server to be saved
            await fetch(`${SERVER_URL}/api/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: cid, text: inputMessage.trim(), userId: user.id })
            });

            setInputMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            // TODO: Mostrar error al usuario
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