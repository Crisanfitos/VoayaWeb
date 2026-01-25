/**
 * Usage Manager
 * Tracks API usage per model with automatic counter reset on expiration.
 * Uses in-memory storage only to avoid file writes that trigger nodemon.
 * Also implements round-robin model rotation for optimal distribution.
 */

import type { Provider, UsageData, ModelUsage, UsageCounter, ModelLimits } from './types';

// Track last used model index for round-robin rotation
let lastModelIndex = 0;

export class UsageManager {
    private usage: UsageData;

    constructor() {
        // Purely in-memory - resets on server restart
        this.usage = { groq: {}, cerebras: {}, gemini: {}, openrouter: {} };
    }

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

    private createCounter(period: 'minute' | 'hour' | 'day'): UsageCounter {
        return { count: 0, resetAt: this.getResetTime(period) };
    }

    private isExpired(counter: UsageCounter): boolean {
        return new Date() >= new Date(counter.resetAt);
    }

    private resetIfExpired(counter: UsageCounter, period: 'minute' | 'hour' | 'day'): UsageCounter {
        if (this.isExpired(counter)) {
            return this.createCounter(period);
        }
        return counter;
    }

    private getModelUsage(provider: Provider, modelId: string, hasHourLimit: boolean): ModelUsage {
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

            if (hasHourLimit) {
                baseUsage.requests.hour = this.createCounter('hour');
                baseUsage.tokens.hour = this.createCounter('hour');
            }

            this.usage[provider][modelId] = baseUsage;
        }

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

    canUseModel(
        provider: Provider,
        modelId: string,
        estimatedTokens: number,
        limits: ModelLimits
    ): boolean {
        const hasHourLimit = provider === 'cerebras';
        const usage = this.getModelUsage(provider, modelId, hasHourLimit);

        // Check request limits
        if (usage.requests.minute.count >= limits.requestsPerMinute) {
            return false;
        }
        if (limits.requestsPerDay !== null && usage.requests.day.count >= limits.requestsPerDay) {
            return false;
        }
        if (limits.requestsPerHour && usage.requests.hour && usage.requests.hour.count >= limits.requestsPerHour) {
            return false;
        }

        // Check token limits (if they exist)
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

    recordUsage(provider: Provider, modelId: string, tokensUsed: number): void {
        const hasHourLimit = provider === 'cerebras';
        const usage = this.getModelUsage(provider, modelId, hasHourLimit);

        usage.requests.minute.count++;
        usage.requests.day.count++;
        if (usage.requests.hour) {
            usage.requests.hour.count++;
        }

        usage.tokens.minute.count += tokensUsed;
        usage.tokens.day.count += tokensUsed;
        if (usage.tokens.hour) {
            usage.tokens.hour.count += tokensUsed;
        }
        // No file save - all in-memory to avoid triggering nodemon
    }

    getAllUsage(): UsageData {
        return this.usage;
    }

    /**
     * Gets the next model index for round-robin rotation
     */
    getNextModelIndex(totalModels: number): number {
        lastModelIndex = (lastModelIndex + 1) % totalModels;
        return lastModelIndex;
    }

    /**
     * Gets the current model index (for logging)
     */
    getCurrentModelIndex(): number {
        return lastModelIndex;
    }
}

export const usageManager = new UsageManager();
