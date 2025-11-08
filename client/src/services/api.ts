import { ChatMessage, TravelBrief, TravelPlan } from '@shared/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.121:3001';

export class ApiService {
    private static async fetchApi(endpoint: string, options: RequestInit = {}) {
        console.log(`[ApiService] Fetching ${API_URL}${endpoint}`);
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        console.log(`[ApiService] Response received with status: ${response.status}`);

        if (!response.ok) {
            console.error(`[ApiService] API error: ${response.status}`);
            throw new Error(`API error: ${response.status}`);
        }

        const responseText = await response.text();
        console.log(`[ApiService] Raw response text:`, responseText);

        try {
            return JSON.parse(responseText);
        } catch (error) {
            console.error(`[ApiService] Error parsing JSON:`, error);
            throw new Error('Error parsing JSON response');
        }
    }

    static async sendChatMessage(message: string, categories?: string[]) {
        return this.fetchApi('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message, categories }),
        });
    }

    static async generatePlan(brief: TravelBrief, userLocation: GeolocationPosition | null) {
        return this.fetchApi('/api/chat/generate-plan', {
            method: 'POST',
            body: JSON.stringify({ brief, userLocation }),
        }) as Promise<TravelPlan>;
    }
}