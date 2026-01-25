/**
 * Types for AI model configuration and usage tracking
 */

export type Provider = 'groq' | 'cerebras' | 'gemini' | 'openrouter';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ModelLimits {
    requestsPerMinute: number;
    requestsPerHour?: number;
    requestsPerDay: number | null;
    tokensPerMinute: number | null;
    tokensPerHour?: number;
    tokensPerDay: number | null;
}

export interface ModelConfig {
    id: string;
    maxContext: number;
    limits: ModelLimits;
    priority: number;
}

export interface ProviderConfig {
    models: ModelConfig[];
}

export interface ModelsConfig {
    groq: ProviderConfig;
    cerebras: ProviderConfig;
    gemini: ProviderConfig;
    openrouter: ProviderConfig;
}

export interface UsageCounter {
    count: number;
    resetAt: string;
}

export interface TimeBasedUsage {
    minute: UsageCounter;
    hour?: UsageCounter;
    day: UsageCounter;
}

export interface ModelUsage {
    requests: TimeBasedUsage;
    tokens: TimeBasedUsage;
}

export interface ProviderUsage {
    [modelId: string]: ModelUsage;
}

export interface UsageData {
    groq: ProviderUsage;
    cerebras: ProviderUsage;
    gemini: ProviderUsage;
    openrouter: ProviderUsage;
}

export interface ModelSelection {
    provider: Provider;
    modelId: string;
    modelConfig: ModelConfig;
}
