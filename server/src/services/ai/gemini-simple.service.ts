import { ChatSession, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
    console.error('⚠️  GEMINI_API_KEY environment variable not set');
}

class GeminiServiceSimplified {
    private ai: GoogleGenerativeAI | null = null;
    private initialized = false;
    private chatSessions: Map<string, ChatSession> = new Map();

    constructor() {
        if (process.env.GEMINI_API_KEY) {
            try {
                this.ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                this.initialized = true;
                console.log('✓ Gemini API initialized');
            } catch (error) {
                console.error('✗ Failed to initialize Gemini API:', error);
                this.initialized = false;
            }
        }
    }

    private getChatSession(chatId: string): ChatSession {
        if (this.chatSessions.has(chatId)) {
            console.log(`[GeminiService] Reusing existing chat session for chatId: ${chatId}`);
            return this.chatSessions.get(chatId)!;
        }

        console.log(`[GeminiService] Creating new chat session for chatId: ${chatId}`);
        if (!this.ai) {
            throw new Error("Gemini AI not initialized");
        }

        const model: GenerativeModel = this.ai.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ],
        });

        const systemPrompt = `Eres "VOAYA - Vuelos", un asistente de viaje virtual experto, amable y eficiente.
Tu única y principal misión es entablar la conversación inicial con un cliente para recopilar la información esencial sobre los VUELOS que necesita.

No eres un motor de búsqueda, no proporcionas precios, ni disponibilidad, ni reservas de vuelos. Tampoco gestionas hoteles ni experiencias.
Tu función es exclusivamente comprender las necesidades de vuelo del cliente, hacer preguntas clave para perfilar esos vuelos y, una vez obtenida la información, notificar que iniciarás el proceso de búsqueda.

FLUJO DE CONVERSACIÓN OBLIGATORIO

Debes seguir este proceso de manera estricta:

1. Análisis del Input Inicial

El cliente te proporcionará un mensaje breve (ej: "Vuelos a París, 2 personas, junio").
Tu tarea es identificar el destino, el número de personas y la fecha o época del vuelo.

2. Confirmación y Pregunta Inicial (Pregunta 1 de 5)

Comienza siempre tu respuesta confirmando lo que has entendido.
Inmediatamente después, formula tu primera pregunta clave sobre los vuelos.

Formato de confirmación:

"De acuerdo, he entendido que sois [Número de Personas] personas y queréis volar a [Destino] en [Mes/Fecha]. ¿Es correcto?"

Continuación con la primera pregunta:

"Para poder ayudaros mejor, me gustaría saber, ¿desde qué aeropuerto o ciudad os gustaría salir?"

3. Recopilación de Información (Máximo 4 preguntas adicionales)

Basándote en el destino y las respuestas, haz un máximo de 4 preguntas adicionales, centradas exclusivamente en los vuelos.

Ejemplos de preguntas clave para Vuelos:

"¿Tenéis flexibilidad en las fechas, o deben ser esos días exactos?"

"¿Preferís vuelos directos o no os importa hacer escalas para conseguir un mejor precio?"

"¿Tenéis alguna preferencia de aerolínea o alianza?"

"¿Qué tipo de equipaje tenéis pensado llevar (solo de mano, una maleta facturada por persona, etc.)?"

"¿Estáis interesados en alguna clase en particular (Turista, Turista Premium, Business)?"

4. Cierre y Transición

Una vez que tengas suficiente información sobre los vuelos (o hayas alcanzado el límite de 5 preguntas), finaliza la conversación.

Frase de cierre obligatoria (Unificada):

"Perfecto, con toda esa información ya tengo una base muy sólida para empezar a buscar."

DIRECTRICES DE COMPORTAMIENTO

Tono: Amable, servicial, positivo y profesional.

Claridad: Haz preguntas directas, una a la vez.

Enfoque: Tu única misión es recabar información de vuelos.

Limitación: Si el cliente pregunta por hoteles o actividades, responde amablemente: "Mi especialidad es ayudar a definir los vuelos. Una vez tengamos esto, mis compañeros podrán ayudar con el resto."`;

        const chat = model.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }, { role: "model", parts: [{ text: "¡Hola! Soy VOAYA, tu asistente de viaje experto. ¿En qué puedo ayudarte hoy?" }] }],
        });

        this.chatSessions.set(chatId, chat);
        return chat;
    }

    public async sendMessage(chatId: string, text: string): Promise<string> {
        if (!this.initialized || !this.ai) {
            console.error('Gemini not initialized, returning mock response');
            return this.getMockResponse(text);
        }

        try {
            console.log(`[GeminiService] Sending message for chatId ${chatId}:`, text);

            const chat = this.getChatSession(chatId);
            const result = await chat.sendMessage(text);
            const response = result.response.text();

            console.log('[GeminiService] Got response:', response);
            return response;
        } catch (error) {
            console.error('[GeminiService] Error calling Gemini:', error);
            return this.getMockResponse(text);
        }
    }

    private getMockResponse(userText: string): string {
        if (userText.toLowerCase().includes('parís')) {
            return 'De acuerdo, he entendido que queréis volar a París en junio para 2 personas. ¿Es correcto?\\n\\nPara poder ayudaros mejor, me gustaría saber, ¿desde qué aeropuerto o ciudad os gustaría salir?';
        }
        return 'Entiendo que tenéis dudas sobre vuestro viaje. Para poder ayudaros mejor, ¿podrías describirme con más detalle qué tipo de viaje estáis buscando?';
    }
}

export const geminiService = new GeminiServiceSimplified();

