import { ChatMessage, TravelBrief, TravelPlan } from '@/types';
import { API_URL } from '@/config/api';

// Tipos para las nuevas APIs (importados desde shared cuando esté configurado)
type TabViajes = 'programados' | 'borradores' | 'pasados';

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
                return { success: true, data: responseText };
            }
        } catch (error: any) {
            console.error(`[ApiService] Fetch error:`, error);
            throw error;
        }
    }

    // ==========================================
    // CHAT
    // ==========================================

    static async startChat(userId: string, categories: string[] = []) {
        return this.fetchApi('/chat/start', {
            method: 'POST',
            body: JSON.stringify({ userId, categories }),
        });
    }

    static async sendMessage(chatId: string, text: string, userId: string) {
        return this.fetchApi('/chat/message', {
            method: 'POST',
            body: JSON.stringify({ chatId, text, userId }),
        });
    }

    static async completeChat(chatId: string) {
        return this.fetchApi('/chat/complete', {
            method: 'POST',
            body: JSON.stringify({ chatId }),
        });
    }

    static async getChats(userId?: string) {
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return this.fetchApi(`/chat${qs}`, {
            method: 'GET'
        });
    }

    static async getChat(chatId: string) {
        if (!chatId) throw new Error('chatId required');
        return this.fetchApi(`/chat/${encodeURIComponent(chatId)}`, {
            method: 'GET'
        });
    }

    static async eliminarChat(chatId: string) {
        return this.fetchApi(`/chat/${encodeURIComponent(chatId)}`, {
            method: 'DELETE'
        });
    }

    static async alternarChatFavorito(chatId: string, esFavorito: boolean) {
        return this.fetchApi(`/chat/${encodeURIComponent(chatId)}/favorito`, {
            method: 'PATCH',
            body: JSON.stringify({ esFavorito }),
        });
    }

    static async sendToExternal(chatId: string, webhookUrl?: string) {
        return this.fetchApi('/chat/send-external', {
            method: 'POST',
            body: JSON.stringify({ chatId, webhookUrl }),
        });
    }

    static async generatePlan(brief: TravelBrief, userLocation: GeolocationPosition | null) {
        return this.fetchApi('/chat/generate-plan', {
            method: 'POST',
            body: JSON.stringify({ brief, userLocation }),
        }) as Promise<TravelPlan>;
    }

    // ==========================================
    // VUELOS
    // ==========================================

    static async obtenerVuelos(usuarioId: string, opciones?: { estado?: string; viajeId?: string }) {
        let qs = `?usuarioId=${encodeURIComponent(usuarioId)}`;
        if (opciones?.estado) qs += `&estado=${encodeURIComponent(opciones.estado)}`;
        if (opciones?.viajeId) qs += `&viajeId=${encodeURIComponent(opciones.viajeId)}`;
        return this.fetchApi(`/vuelos${qs}`, { method: 'GET' });
    }

    static async obtenerVuelo(id: string) {
        return this.fetchApi(`/vuelos/${encodeURIComponent(id)}`, { method: 'GET' });
    }

    static async crearVuelo(vuelo: any) {
        return this.fetchApi('/vuelos', {
            method: 'POST',
            body: JSON.stringify(vuelo),
        });
    }

    static async actualizarVuelo(id: string, vuelo: any) {
        return this.fetchApi(`/vuelos/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(vuelo),
        });
    }

    static async eliminarVuelo(id: string) {
        return this.fetchApi(`/vuelos/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    // ==========================================
    // HOTELES
    // ==========================================

    static async obtenerHoteles(usuarioId: string, opciones?: { estado?: string; viajeId?: string }) {
        let qs = `?usuarioId=${encodeURIComponent(usuarioId)}`;
        if (opciones?.estado) qs += `&estado=${encodeURIComponent(opciones.estado)}`;
        if (opciones?.viajeId) qs += `&viajeId=${encodeURIComponent(opciones.viajeId)}`;
        return this.fetchApi(`/hoteles${qs}`, { method: 'GET' });
    }

    static async obtenerHotel(id: string) {
        return this.fetchApi(`/hoteles/${encodeURIComponent(id)}`, { method: 'GET' });
    }

    static async crearHotel(hotel: any) {
        return this.fetchApi('/hoteles', {
            method: 'POST',
            body: JSON.stringify(hotel),
        });
    }

    static async actualizarHotel(id: string, hotel: any) {
        return this.fetchApi(`/hoteles/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(hotel),
        });
    }

    static async eliminarHotel(id: string) {
        return this.fetchApi(`/hoteles/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    // ==========================================
    // VIAJES
    // ==========================================

    static async obtenerViajes(usuarioId: string, tab: TabViajes = 'programados') {
        const qs = `?usuarioId=${encodeURIComponent(usuarioId)}&tab=${encodeURIComponent(tab)}`;
        return this.fetchApi(`/viajes${qs}`, { method: 'GET' });
    }

    static async obtenerViaje(id: string) {
        return this.fetchApi(`/viajes/${encodeURIComponent(id)}`, { method: 'GET' });
    }

    static async crearViaje(viaje: any) {
        return this.fetchApi('/viajes', {
            method: 'POST',
            body: JSON.stringify(viaje),
        });
    }

    static async crearViajeDesdechat(chatId: string, usuarioId: string) {
        return this.fetchApi(`/viajes/${encodeURIComponent(chatId)}/crear-desde-chat`, {
            method: 'POST',
            body: JSON.stringify({ usuarioId }),
        });
    }

    static async actualizarViaje(id: string, viaje: any) {
        return this.fetchApi(`/viajes/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(viaje),
        });
    }

    static async eliminarViaje(id: string) {
        return this.fetchApi(`/viajes/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    // ==========================================
    // USUARIO - PREFERENCIAS
    // ==========================================

    static async actualizarPreferenciasIA(usuarioId: string, preferencias: any) {
        return this.fetchApi(`/usuarios/${encodeURIComponent(usuarioId)}/preferencias`, {
            method: 'PATCH',
            body: JSON.stringify({ preferenciasIa: preferencias }),
        });
    }

    static async actualizarTema(usuarioId: string, temaModo: 'light' | 'dark' | 'system') {
        return this.fetchApi(`/usuarios/${encodeURIComponent(usuarioId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ temaModo }),
        });
    }
}