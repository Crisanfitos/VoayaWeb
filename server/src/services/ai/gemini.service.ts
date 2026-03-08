/**
 * Gemini AI Service
 * Single-provider service using Google Gemini for all AI chat interactions.
 * Replaces the multi-provider AI router with a simpler, more consistent approach.
 */

import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const MODEL_ID = 'gemini-2.0-flash';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

class GeminiService {
    private client: GoogleGenerativeAI | null = null;

    constructor() {
        if (GOOGLE_API_KEY) {
            this.client = new GoogleGenerativeAI(GOOGLE_API_KEY);
            console.log(`✓ Gemini Service initialized (model: ${MODEL_ID})`);
        } else {
            console.error('✗ No GOOGLE_API_KEY or GEMINI_API_KEY configured');
        }
    }

    /**
     * Send a message with conversation history and get a streaming response.
     * Uses Gemini's native systemInstruction and chat history for proper context.
     */
    async *sendMessageStream(
        messages: ChatMessage[],
        systemPrompt?: string
    ): AsyncGenerator<string, void, unknown> {
        if (!this.client) {
            throw new Error('Gemini not initialized. Set GOOGLE_API_KEY environment variable.');
        }

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const model = this.client.getGenerativeModel({
                    model: MODEL_ID,
                    systemInstruction: systemPrompt || undefined,
                    safetySettings: [
                        {
                            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                        },
                    ],
                    generationConfig: {
                        temperature: 0.8,
                    },
                });

                // Build chat history from previous messages (all except the last one)
                const history = messages.slice(0, -1).map(m => ({
                    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
                    parts: [{ text: m.content }],
                }));

                const chat = model.startChat({ history });

                // Send the last message and stream the response
                const lastMessage = messages[messages.length - 1];
                const result = await chat.sendMessageStream(lastMessage.content);

                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    if (text) {
                        yield text;
                    }
                }

                console.log(`[Gemini] ✓ Response completed (attempt ${attempt})`);
                return;

            } catch (error: unknown) {
                lastError = error as Error;
                const statusCode = (error as { status?: number }).status || 500;
                const message = (error as Error).message || 'Unknown error';

                console.error(`[Gemini] ✗ Attempt ${attempt}/${MAX_RETRIES} failed (${statusCode}): ${message}`);

                // Don't retry on 4xx errors (except 429 rate limit)
                if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
                    break;
                }

                // Wait before retrying (exponential backoff)
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
                }
            }
        }

        throw new Error(`Gemini request failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
    }

    /**
     * Extracts travel data from chat history in a structured JSON format.
     */
    async extractTravelData(messages: ChatMessage[]): Promise<any> {
        if (!this.client) {
            throw new Error('Gemini not initialized.');
        }

        const model = this.client.getGenerativeModel({
            model: MODEL_ID,
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
            },
        });

        const prompt = `
            Analyze the following travel chat history and extract key information in structured JSON format.
            Current date for relative reference: ${new Date().toLocaleDateString()} (Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}).

            The JSON MUST include:
            - destination_name: Full name of the destination.
            - departure_date: YYYY-MM-DD format. If they say "this Friday", calculate the date based on today.
            - return_date: YYYY-MM-DD format. Look for "weekend", "Sunday", "back on...", or implied trip duration.
            - is_round_trip: boolean. true if a return date or "round trip" is mentioned.
            - passengers: Object with { adults: number, children: number, infants: number }. Default adults to 1 if not specified.
            - origin: IATA code or city name of departure.
            - destination: IATA code or city name of arrival.
            - trip_type: string (e.g., "Negocios", "Vacaciones", "Escapada").
            - budget: string if mentioned.
            - extraction_confidence: number 0-1.

            Chat History:
            ${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('[Gemini] Failed to parse extraction JSON:', text);
            return null;
        }
    }
}

export const geminiService = new GeminiService();
