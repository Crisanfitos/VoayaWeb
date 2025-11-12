import { GoogleGenAI, Chat as GeminiChat } from '@google/genai';
import { Chat, Message, ChatMetadata, ChatInstance, ChatCategory } from '@/shared/types/chat';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    getFirestore
} from 'firebase/firestore';

export class ChatService {
    private chatInstances: Map<string, ChatInstance>;
    private ai: GoogleGenAI;
    private db;

    constructor() {
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }

        this.ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        this.chatInstances = new Map();
        this.db = getFirestore();
    }

    private async createFirestoreChat(userId: string, categories: ChatCategory[]): Promise<string> {
        const chatsRef = collection(this.db, 'chats');
        const chatDoc = await addDoc(chatsRef, {
            userId,
            createdAt: serverTimestamp(),
            title: 'Nuevo Chat', // Se actualizará con el primer mensaje
            status: 'active',
            categories,
            lastMessageAt: serverTimestamp(),
            metadata: {}
        });

        return chatDoc.id;
    }

    private async updateChatMetadata(chatId: string, metadata: Partial<ChatMetadata>): Promise<void> {
        const chatRef = doc(this.db, 'chats', chatId);
        await updateDoc(chatRef, {
            metadata: metadata,
            lastMessageAt: serverTimestamp()
        });
    }

    private async saveMessage(chatId: string, message: Omit<Message, 'id'>): Promise<string> {
        const messagesRef = collection(this.db, 'chats', chatId, 'messages');
        const messageDoc = await addDoc(messagesRef, {
            ...message,
            createdAt: serverTimestamp()
        });

        return messageDoc.id;
    }

    private extractMetadata(text: string): Partial<ChatMetadata> {
        const { chatMetadata } = MetadataExtractor.extract(text);
        return chatMetadata;
    }

    public async initializeChat(userId: string, categories: ChatCategory[] = []): Promise<string> {
        const chatId = await this.createFirestoreChat(userId, categories);

        const geminiChat = this.ai.startChat({
            model: 'gemini-pro',
            // Configurar el chat según las categorías
        });

        this.chatInstances.set(chatId, {
            id: chatId,
            geminiChat,
            metadata: {}
        });

        return chatId;
    }

    public async processMessage(chatId: string, text: string, userId: string): Promise<void> {
        let chatInstance = this.chatInstances.get(chatId);

        if (!chatInstance) {
            // Si la instancia no existe, la creamos
            const chat = await this.initializeChat(userId);
            chatInstance = this.chatInstances.get(chat);
        }

        if (!chatInstance) {
            throw new Error('Failed to initialize chat instance');
        }

        // Guardar mensaje del usuario
        await this.saveMessage(chatId, {
            chatId,
            role: 'user',
            text,
            metadata: {}
        });

        // Extraer metadatos del mensaje
        const metadata = this.extractMetadata(text);

        // Actualizar metadatos del chat
        await this.updateChatMetadata(chatId, {
            ...chatInstance.metadata,
            ...metadata
        });

        // Procesar con Gemini
        const response = await chatInstance.geminiChat.sendMessage(text);
        const assistantResponse = await response.text();

        // Guardar respuesta del asistente
        await this.saveMessage(chatId, {
            chatId,
            role: 'assistant',
            text: assistantResponse,
            metadata: {}
        });
    }
}