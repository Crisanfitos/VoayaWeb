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
}

export const geminiService = new GeminiService();
