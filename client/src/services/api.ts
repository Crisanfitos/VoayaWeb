import { ChatMessage, TravelBrief, TravelPlan } from '@shared/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiService {
    private static async fetchApi(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
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