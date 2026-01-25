import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Provider, UsageData, ModelUsage, UsageCounter, ModelLimits } from './types';

const DATA_DIR = './data';
const USAGE_FILE = `${DATA_DIR}/usage.json`;

/**
 * Gestiona el tracking de uso por modelo con persistencia en archivo JSON.
 * Maneja automáticamente el reset de contadores cuando expiran.
 */
export class UsageManager {
    private usage: UsageData;
    private currentModelIndex = 0;

    constructor() {
        this.usage = this.loadUsage();
    }

    /**
     * Carga el uso desde el archivo JSON o crea uno nuevo si no existe.
     */
    private loadUsage(): UsageData {
        try {
            if (existsSync(USAGE_FILE)) {
                const data = readFileSync(USAGE_FILE, 'utf-8');
                return JSON.parse(data) as UsageData;
            }
        } catch (error) {
            console.warn('Error loading usage data, creating new:', error);
        }

        return { groq: {}, cerebras: {}, gemini: {}, openrouter: {} };
    }

    /**
     * Guarda el uso actual en el archivo JSON.
     */
    private saveUsage(): void {
        try {
            if (!existsSync(DATA_DIR)) {
                mkdirSync(DATA_DIR, { recursive: true });
            }
            writeFileSync(USAGE_FILE, JSON.stringify(this.usage, null, 2));
        } catch (error) {
            console.error('Error saving usage data:', error);
        }
    }

    /**
     * Obtiene la fecha de reset para un período determinado.
     */
    private getResetTime(period: 'minute' | 'hour' | 'day'): string {
        const now = new Date();

        switch (period) {
            case 'minute':
                now.setSeconds(0, 0);
                now.setMinutes(now.getMinutes() + 1);
                break;
            case 'hour':
                now.setMinutes(0, 0, 0);
                now.setHours(now.getHours() + 1);
                break;
            case 'day':
                now.setHours(0, 0, 0, 0);
                now.setDate(now.getDate() + 1);
                break;
        }

        return now.toISOString();
    }

    /**
     * Crea un contador nuevo para un período.
     */
    private createCounter(period: 'minute' | 'hour' | 'day'): UsageCounter {
        return {
            count: 0,
            resetAt: this.getResetTime(period)
        };
    }

    /**
     * Verifica si un contador ha expirado y necesita reset.
     */
    private isExpired(counter: UsageCounter): boolean {
        return new Date() >= new Date(counter.resetAt);
    }

    /**
     * Resetea un contador si ha expirado.
     */
    private resetIfExpired(counter: UsageCounter, period: 'minute' | 'hour' | 'day'): UsageCounter {
        if (this.isExpired(counter)) {
            return this.createCounter(period);
        }
        return counter;
    }

    /**
     * Obtiene o inicializa el uso de un modelo.
     */
    private getModelUsage(provider: Provider, modelId: string, hasCerebrasHourLimit: boolean): ModelUsage {
        if (!this.usage[provider][modelId]) {
            const baseUsage: ModelUsage = {
                requests: {
                    minute: this.createCounter('minute'),
                    day: this.createCounter('day')
                },
                tokens: {
                    minute: this.createCounter('minute'),
                    day: this.createCounter('day')
                }
            };

            // Cerebras tiene límites por hora
            if (hasCerebrasHourLimit) {
                baseUsage.requests.hour = this.createCounter('hour');
                baseUsage.tokens.hour = this.createCounter('hour');
            }

            this.usage[provider][modelId] = baseUsage;
        }

        // Resetear contadores expirados
        const usage = this.usage[provider][modelId];
        usage.requests.minute = this.resetIfExpired(usage.requests.minute, 'minute');
        usage.requests.day = this.resetIfExpired(usage.requests.day, 'day');
        usage.tokens.minute = this.resetIfExpired(usage.tokens.minute, 'minute');
        usage.tokens.day = this.resetIfExpired(usage.tokens.day, 'day');

        if (usage.requests.hour) {
            usage.requests.hour = this.resetIfExpired(usage.requests.hour, 'hour');
        }
        if (usage.tokens.hour) {
            usage.tokens.hour = this.resetIfExpired(usage.tokens.hour, 'hour');
        }

        return usage;
    }

    /**
     * Verifica si un modelo puede manejar una petición con los tokens estimados.
     */
    canUseModel(
        provider: Provider,
        modelId: string,
        estimatedTokens: number,
        limits: ModelLimits
    ): boolean {
        const hasCerebrasHourLimit = provider === 'cerebras';
        const usage = this.getModelUsage(provider, modelId, hasCerebrasHourLimit);

        // Verificar límites de requests
        if (usage.requests.minute.count >= limits.requestsPerMinute) {
            return false;
        }
        if (limits.requestsPerDay !== null && usage.requests.day.count >= limits.requestsPerDay) {
            return false;
        }
        if (limits.requestsPerHour && usage.requests.hour && usage.requests.hour.count >= limits.requestsPerHour) {
            return false;
        }

        // Verificar límites de tokens
        if (limits.tokensPerMinute !== null && usage.tokens.minute.count + estimatedTokens > limits.tokensPerMinute) {
            return false;
        }
        if (limits.tokensPerDay !== null && usage.tokens.day.count + estimatedTokens > limits.tokensPerDay) {
            return false;
        }
        if (limits.tokensPerHour && usage.tokens.hour && usage.tokens.hour.count + estimatedTokens > limits.tokensPerHour) {
            return false;
        }

        return true;
    }

    /**
     * Registra el uso de un modelo después de una petición.
     */
    recordUsage(provider: Provider, modelId: string, tokensUsed: number): void {
        const hasCerebrasHourLimit = provider === 'cerebras';
        const usage = this.getModelUsage(provider, modelId, hasCerebrasHourLimit);

        // Incrementar contadores de requests
        usage.requests.minute.count++;
        usage.requests.day.count++;
        if (usage.requests.hour) {
            usage.requests.hour.count++;
        }

        // Incrementar contadores de tokens
        usage.tokens.minute.count += tokensUsed;
        usage.tokens.day.count += tokensUsed;
        if (usage.tokens.hour) {
            usage.tokens.hour.count += tokensUsed;
        }

        this.saveUsage();
    }

    /**
     * Obtiene estadísticas de uso actuales para logging/debugging.
     */
    getUsageStats(provider: Provider, modelId: string): ModelUsage | null {
        return this.usage[provider]?.[modelId] || null;
    }

    /**
     * Obtiene todo el uso actual (para debugging).
     */
    getAllUsage(): UsageData {
        return this.usage;
    }

    /**
     * Get next model index for round-robin selection
     */
    getNextModelIndex(count: number): number {
        if (count === 0) return 0;
        // Simple round-robin: increment internal counter
        // We use the count of currently available models passed in
        this.currentModelIndex = (this.currentModelIndex + 1) % count;
        return this.currentModelIndex;
    }
}

// Singleton para usar en toda la aplicación
export const usageManager = new UsageManager();
