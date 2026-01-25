/**
 * AI Router Service
 * Selects the best available model based on limits and makes API calls to providers.
 * Supports auto-retry on errors and integrates with model health tracking.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { ChatMessage, Provider, ModelConfig, ModelSelection } from './types';
import { modelsConfig } from './models-config';
import { usageManager } from './usage-manager';
import { modelHealth } from './model-health';
import { estimateMessagesTokens } from './token-estimator';

// API Keys from environment
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Max retry attempts
const MAX_RETRIES = 5;

// Custom error class with status code
class AIError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

class AIRouterService {
    private geminiClient: GoogleGenerativeAI | null = null;

    constructor() {
        if (GOOGLE_API_KEY) {
            this.geminiClient = new GoogleGenerativeAI(GOOGLE_API_KEY);
            console.log('✓ AI Router: Gemini initialized');
        }
        if (GROQ_API_KEY) console.log('✓ AI Router: Groq API key configured');
        if (CEREBRAS_API_KEY) console.log('✓ AI Router: Cerebras API key configured');
        if (OPENROUTER_API_KEY) console.log('✓ AI Router: OpenRouter API key configured');
    }

    /**
     * Get all available and healthy models
     */
    private getAvailableModels(estimatedTokens: number): ModelSelection[] {
        const available: ModelSelection[] = [];

        // Collect all available models from all providers
        if (this.geminiClient) {
            for (const model of modelsConfig.gemini.models) {
                if (this.isModelAvailable('gemini', model, estimatedTokens)) {
                    available.push({ provider: 'gemini', modelId: model.id, modelConfig: model });
                }
            }
        }

        if (GROQ_API_KEY) {
            for (const model of modelsConfig.groq.models) {
                if (this.isModelAvailable('groq', model, estimatedTokens)) {
                    available.push({ provider: 'groq', modelId: model.id, modelConfig: model });
                }
            }
        }

        if (CEREBRAS_API_KEY) {
            for (const model of modelsConfig.cerebras.models) {
                if (this.isModelAvailable('cerebras', model, estimatedTokens)) {
                    available.push({ provider: 'cerebras', modelId: model.id, modelConfig: model });
                }
            }
        }

        if (OPENROUTER_API_KEY) {
            for (const model of modelsConfig.openrouter.models) {
                if (this.isModelAvailable('openrouter', model, estimatedTokens)) {
                    available.push({ provider: 'openrouter', modelId: model.id, modelConfig: model });
                }
            }
        }

        return available;
    }

    private isModelAvailable(provider: Provider, model: ModelConfig, estimatedTokens: number): boolean {
        // Check token limits
        if (estimatedTokens > model.maxContext) {
            return false;
        }
        // Check usage limits
        if (!usageManager.canUseModel(provider, model.id, estimatedTokens, model.limits)) {
            return false;
        }
        // Check model health
        if (!modelHealth.isModelAvailable(provider, model.id)) {
            return false;
        }
        return true;
    }

    /**
     * Select next model, excluding already tried ones
     */
    private selectNextModel(messages: ChatMessage[], excludeModels: Set<string>): ModelSelection | null {
        const estimatedTokens = estimateMessagesTokens(messages);
        const allAvailable = this.getAvailableModels(estimatedTokens);

        // Filter out already tried models
        const available = allAvailable.filter(m => !excludeModels.has(`${m.provider}:${m.modelId}`));

        if (available.length === 0) {
            return null;
        }

        // Round-robin selection
        const nextIndex = usageManager.getNextModelIndex(available.length);
        return available[nextIndex];
    }

    /**
     * Sends a message with auto-retry on errors
     */
    async *sendMessageStream(
        messages: ChatMessage[],
        systemPrompt?: string
    ): AsyncGenerator<string, void, unknown> {
        const triedModels = new Set<string>();
        let lastError: Error | null = null;
        let attempt = 0;

        while (attempt < MAX_RETRIES) {
            const selection = this.selectNextModel(messages, triedModels);

            if (!selection) {
                if (lastError) {
                    throw lastError;
                }
                throw new Error('All AI models at capacity or disabled. Please try again later.');
            }

            const modelKey = `${selection.provider}:${selection.modelId}`;
            triedModels.add(modelKey);
            attempt++;

            console.log(`[AIRouter] Attempt ${attempt}/${MAX_RETRIES}: ${selection.provider}/${selection.modelId}`);

            try {
                // Try to get response from this model
                const result = await this.tryModelStream(messages, selection, systemPrompt);

                // Success! Record it and yield results
                modelHealth.recordSuccess(selection.provider, selection.modelId);

                for await (const chunk of result.stream) {
                    yield chunk;
                }

                // Record usage after successful completion
                usageManager.recordUsage(selection.provider, selection.modelId, result.tokens);
                console.log(`[AIRouter] ✓ Completed with ${selection.provider}/${selection.modelId}. Tokens: ${result.tokens}`);
                return;

            } catch (error) {
                lastError = error as Error;
                const statusCode = (error as AIError).statusCode || 500;
                const errorMessage = (error as Error).message || 'Unknown error';

                // Record error asynchronously (non-blocking)
                setImmediate(() => {
                    modelHealth.recordError(selection.provider, selection.modelId, statusCode, errorMessage);
                });

                console.log(`[AIRouter] ✗ ${selection.provider}/${selection.modelId} failed (${statusCode}), trying next...`);
            }
        }

        // All retries exhausted
        throw new Error(`All retry attempts failed. Last error: ${lastError?.message}`);
    }

    /**
     * Try a specific model and return streaming result
     */
    private async tryModelStream(
        messages: ChatMessage[],
        selection: ModelSelection,
        systemPrompt?: string
    ): Promise<{ stream: AsyncIterable<string>; tokens: number }> {
        const estimatedInputTokens = estimateMessagesTokens(messages);
        let stream: AsyncIterable<string>;

        switch (selection.provider) {
            case 'gemini':
                stream = await this.callGeminiStream(messages, selection.modelId, systemPrompt);
                break;
            case 'groq':
                stream = await this.callGroqStream(messages, selection.modelId, systemPrompt);
                break;
            case 'cerebras':
                stream = await this.callCerebrasStream(messages, selection.modelId, systemPrompt);
                break;
            case 'openrouter':
                stream = await this.callOpenRouterStream(messages, selection.modelId, systemPrompt);
                break;
        }

        // Wrap stream to count output tokens
        let outputTokens = 0;
        const countingStream = async function* () {
            for await (const chunk of stream) {
                outputTokens += chunk.length / 3;
                yield chunk;
            }
        };

        return {
            stream: countingStream(),
            tokens: estimatedInputTokens + Math.ceil(outputTokens)
        };
    }

    // === Provider-specific implementations ===

    private async *callGeminiStream(
        messages: ChatMessage[],
        modelId: string,
        systemPrompt?: string
    ): AsyncIterable<string> {
        if (!this.geminiClient) throw new AIError('Gemini not initialized', 500);

        try {
            const model = this.geminiClient.getGenerativeModel({
                model: modelId,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ],
            });

            const history = messages.slice(0, -1).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

            if (systemPrompt) {
                history.unshift(
                    { role: 'user', parts: [{ text: systemPrompt }] },
                    { role: 'model', parts: [{ text: 'Entendido. Seguiré las instrucciones proporcionadas.' }] }
                );
            }

            const chat = model.startChat({ history });
            const lastMessage = messages[messages.length - 1];
            const result = await chat.sendMessageStream(lastMessage.content);

            for await (const chunk of result.stream) {
                yield chunk.text();
            }
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            throw new AIError(err.message || 'Gemini error', err.status || 500);
        }
    }

    private async *callGroqStream(
        messages: ChatMessage[],
        modelId: string,
        systemPrompt?: string
    ): AsyncIterable<string> {
        const formattedMessages = systemPrompt
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelId,
                messages: formattedMessages.map(m => ({ role: m.role, content: m.content })),
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new AIError(`Groq API error: ${response.statusText}`, response.status);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new AIError('No response body', 500);

        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) yield content;
                } catch { /* ignore parse errors */ }
            }
        }
    }

    private async *callCerebrasStream(
        messages: ChatMessage[],
        modelId: string,
        systemPrompt?: string
    ): AsyncIterable<string> {
        const formattedMessages = systemPrompt
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages;

        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelId,
                messages: formattedMessages.map(m => ({ role: m.role, content: m.content })),
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new AIError(`Cerebras API error: ${response.statusText}`, response.status);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new AIError('No response body', 500);

        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) yield content;
                } catch { /* ignore parse errors */ }
            }
        }
    }

    private async *callOpenRouterStream(
        messages: ChatMessage[],
        modelId: string,
        systemPrompt?: string
    ): AsyncIterable<string> {
        const formattedMessages = systemPrompt
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://voaya.app',
                'X-Title': 'Voaya Travel Assistant',
            },
            body: JSON.stringify({
                model: modelId,
                messages: formattedMessages.map(m => ({ role: m.role, content: m.content })),
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new AIError(`OpenRouter API error: ${response.statusText}`, response.status);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new AIError('No response body', 500);

        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) yield content;
                } catch { /* ignore parse errors */ }
            }
        }
    }

    /**
     * Get status of all models for debugging/monitoring
     */
    getModelsStatus() {
        return {
            usage: usageManager.getAllUsage(),
            health: modelHealth.getAllHealth(),
            summary: modelHealth.getSummary(),
            providers: {
                gemini: !!this.geminiClient,
                groq: !!GROQ_API_KEY,
                cerebras: !!CEREBRAS_API_KEY,
                openrouter: !!OPENROUTER_API_KEY,
            }
        };
    }
}

export const aiRouter = new AIRouterService();
