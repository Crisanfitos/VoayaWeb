import { ChatMessage, TravelBrief, TravelPlan } from '@/types';
import { API_URL } from '@/config/api';

export class ApiService {
    private static async fetchApi(endpoint: string, options: RequestInit = {}) {
        const url = `${API_URL}${endpoint}`;
        try {
            console.log(`[ApiService] Fetching ${url}`, { method: options.method });

            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            console.log(`[ApiService] Response received with status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[ApiService] API error: ${response.status}`, errorText);
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }

            const responseText = await response.text();
            console.log(`[ApiService] Raw response text:`, responseText);

            try {
                const data = JSON.parse(responseText);
                console.log(`[ApiService] Parsed response:`, data);
                return data;
            } catch (error) {
                console.error(`[ApiService] Error parsing JSON:`, error);
                // Si el parseo falla, pero la respuesta fue exitosa (ej. 204 No Content),
                // podríamos devolver un objeto vacío o el texto plano si es necesario.
                return { success: true, data: responseText };
            }
        } catch (error: any) {
            console.error(`[ApiService] Fetch error:`, error);
            throw error;
        }
    } static async startChat(userId: string, categories: string[] = []) {
        return this.fetchApi('/api/chat/start', {
            method: 'POST',
            body: JSON.stringify({ userId, categories }),
        });
    }

    static async sendMessage(chatId: string, text: string, userId: string) {
        return this.fetchApi('/api/chat/message', {
            method: 'POST',
            body: JSON.stringify({ chatId, text, userId }),
        });
    }

    static async completeChat(chatId: string) {
        return this.fetchApi('/api/chat/complete', {
            method: 'POST',
            body: JSON.stringify({ chatId }),
        });
    }

    static async getChats(userId?: string) {
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return this.fetchApi(`/api/chat${qs}`, {
            method: 'GET'
        });
    }

    static async getChat(chatId: string) {
        if (!chatId) throw new Error('chatId required');
        return this.fetchApi(`/api/chat/${encodeURIComponent(chatId)}`, {
            method: 'GET'
        });
    }

    static async sendToExternal(chatId: string, webhookUrl?: string) {
        return this.fetchApi('/api/chat/send-external', {
            method: 'POST',
            body: JSON.stringify({ chatId, webhookUrl }),
        });
    }

    static async generatePlan(brief: TravelBrief, userLocation: GeolocationPosition | null) {
        return this.fetchApi('/api/chat/generate-plan', {
            method: 'POST',
            body: JSON.stringify({ brief, userLocation }),
        }) as Promise<TravelPlan>;
    }
}