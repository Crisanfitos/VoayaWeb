/**
 * AI Models Configuration
 * Complete list of all free models from Groq, Cerebras, Gemini, and OpenRouter with their limits
 * Total: 48 models for maximum rotation capacity
 */

import type { ModelsConfig } from './types';

export const modelsConfig: ModelsConfig = {
    groq: {
        models: [
            {
                id: "llama-3.1-8b-instant",
                maxContext: 8192,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerDay: 14400,
                    tokensPerMinute: 6000,
                    tokensPerDay: 500000
                },
                priority: 1
            },
            {
                id: "meta-llama/llama-4-scout-17b-16e-instruct",
                maxContext: 131072,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerDay: 1000,
                    tokensPerMinute: 30000,
                    tokensPerDay: 500000
                },
                priority: 2
            },

            {
                id: "llama-3.3-70b-versatile",
                maxContext: 32768,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerDay: 1000,
                    tokensPerMinute: 12000,
                    tokensPerDay: 100000
                },
                priority: 4
            },
            {
                id: "meta-llama/llama-4-maverick-17b-128e-instruct",
                maxContext: 131072,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerDay: 1000,
                    tokensPerMinute: 6000,
                    tokensPerDay: 500000
                },
                priority: 5
            },
            {
                id: "moonshotai/kimi-k2-instruct",
                maxContext: 131072,
                limits: {
                    requestsPerMinute: 60,
                    requestsPerDay: 1000,
                    tokensPerMinute: 10000,
                    tokensPerDay: 300000
                },
                priority: 6
            },
            {
                id: "moonshotai/kimi-k2-instruct-0905",
                maxContext: 131072,
                limits: {
                    requestsPerMinute: 60,
                    requestsPerDay: 1000,
                    tokensPerMinute: 10000,
                    tokensPerDay: 300000
                },
                priority: 7
            },
            {
                id: "qwen/qwen3-32b",
                maxContext: 32768,
                limits: {
                    requestsPerMinute: 60,
                    requestsPerDay: 1000,
                    tokensPerMinute: 6000,
                    tokensPerDay: 500000
                },
                priority: 8
            },
            {
                id: "allam-2-7b",
                maxContext: 8192,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerDay: 7000,
                    tokensPerMinute: 6000,
                    tokensPerDay: 500000
                },
                priority: 9
            },
            {
                id: "groq/compound",
                maxContext: 131072,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerDay: 250,
                    tokensPerMinute: 70000,
                    tokensPerDay: null
                },
                priority: 10
            },
            {
                id: "groq/compound-mini",
                maxContext: 131072,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerDay: 250,
                    tokensPerMinute: 70000,
                    tokensPerDay: null
                },
                priority: 11
            },
            {
                id: "openai/gpt-oss-120b",
                maxContext: 131072,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerDay: 1000,
                    tokensPerMinute: 8000,
                    tokensPerDay: 200000
                },
                priority: 12
            },
            {
                id: "openai/gpt-oss-20b",
                maxContext: 131072,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerDay: 1000,
                    tokensPerMinute: 8000,
                    tokensPerDay: 200000
                },
                priority: 13
            },


        ]
    },
    cerebras: {
        models: [
            {
                id: "llama-3.3-70b",
                maxContext: 65536,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerHour: 900,
                    requestsPerDay: 14400,
                    tokensPerMinute: 64000,
                    tokensPerHour: 1000000,
                    tokensPerDay: 1000000
                },
                priority: 1
            },
            {
                id: "llama3.1-8b",
                maxContext: 8192,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerHour: 900,
                    requestsPerDay: 14400,
                    tokensPerMinute: 64000,
                    tokensPerHour: 1000000,
                    tokensPerDay: 1000000
                },
                priority: 2
            },
            {
                id: "qwen-3-32b",
                maxContext: 65536,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerHour: 900,
                    requestsPerDay: 14400,
                    tokensPerMinute: 64000,
                    tokensPerHour: 1000000,
                    tokensPerDay: 1000000
                },
                priority: 3
            },
            {
                id: "gpt-oss-120b",
                maxContext: 65536,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerHour: 900,
                    requestsPerDay: 14400,
                    tokensPerMinute: 64000,
                    tokensPerHour: 1000000,
                    tokensPerDay: 1000000
                },
                priority: 4
            },
            {
                id: "qwen-3-235b-a22b-instruct-2507",
                maxContext: 65536,
                limits: {
                    requestsPerMinute: 30,
                    requestsPerHour: 900,
                    requestsPerDay: 1440,
                    tokensPerMinute: 64000,
                    tokensPerHour: 1000000,
                    tokensPerDay: 1000000
                },
                priority: 5
            },
            {
                id: "zai-glm-4.6",
                maxContext: 64000,
                limits: {
                    requestsPerMinute: 10,
                    requestsPerHour: 100,
                    requestsPerDay: 100,
                    tokensPerMinute: 60000,
                    tokensPerHour: 100000,
                    tokensPerDay: 1000000
                },
                priority: 6
            }
        ]
    },
    gemini: {
        models: [
            {
                id: "gemini-2.0-flash-lite",
                maxContext: 1048576,
                limits: {
                    requestsPerMinute: 4000,
                    requestsPerDay: null,
                    tokensPerMinute: 4000000,
                    tokensPerDay: null
                },
                priority: 1
            },
            {
                id: "gemini-2.0-flash",
                maxContext: 1048576,
                limits: {
                    requestsPerMinute: 2000,
                    requestsPerDay: null,
                    tokensPerMinute: 4000000,
                    tokensPerDay: null
                },
                priority: 2
            },
            {
                id: "gemini-2.5-flash-lite",
                maxContext: 1048576,
                limits: {
                    requestsPerMinute: 4000,
                    requestsPerDay: null,
                    tokensPerMinute: 4000000,
                    tokensPerDay: null
                },
                priority: 3
            },
            {
                id: "gemini-2.5-flash",
                maxContext: 1048576,
                limits: {
                    requestsPerMinute: 1000,
                    requestsPerDay: 10000,
                    tokensPerMinute: 1000000,
                    tokensPerDay: null
                },
                priority: 4
            },
            {
                id: "gemini-2.0-flash-exp",
                maxContext: 1048576,
                limits: {
                    requestsPerMinute: 10,
                    requestsPerDay: 500,
                    tokensPerMinute: 250000,
                    tokensPerDay: null
                },
                priority: 5
            },
            {
                id: "gemini-2.5-pro",
                maxContext: 1048576,
                limits: {
                    requestsPerMinute: 150,
                    requestsPerDay: 10000,
                    tokensPerMinute: 2000000,
                    tokensPerDay: null
                },
                priority: 6
            }
        ]
    },
    openrouter: {
        models: [
            {
                id: "meta-llama/llama-3.3-70b-instruct:free",
                maxContext: 128000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 1
            },
            {
                id: "openai/gpt-oss-120b:free",
                maxContext: 131000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 2
            },
            {
                id: "tngtech/deepseek-r1t-chimera:free",
                maxContext: 164000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 3
            },
            {
                id: "deepseek/deepseek-r1-0528:free",
                maxContext: 164000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 4
            },
            {
                id: "qwen/qwen3-coder:free",
                maxContext: 128000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 5
            },
            {
                id: "google/gemma-3-27b-it:free",
                maxContext: 131000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 6
            },
            {
                id: "z-ai/glm-4.5-air:free",
                maxContext: 128000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 7
            },
            {
                id: "openai/gpt-oss-20b:free",
                maxContext: 131000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 8
            },
            {
                id: "tngtech/deepseek-r1t2-chimera:free",
                maxContext: 60000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 9
            },
            {
                id: "qwen/qwen3-next-80b-a3b-instruct:free",
                maxContext: 128000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 10
            },
            {
                id: "tngtech/tng-r1t-chimera:free",
                maxContext: 64000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 11
            },
            {
                id: "nvidia/nemotron-3-nano-30b-a3b:free",
                maxContext: 32000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 12
            },
            {
                id: "mistralai/mistral-small-3.1-24b-instruct:free",
                maxContext: 32000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 13
            },
            {
                id: "arcee-ai/trinity-mini:free",
                maxContext: 32000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 14
            },
            {
                id: "qwen/qwen-2.5-vl-7b-instruct:free",
                maxContext: 32000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 15
            },
            {
                id: "meta-llama/llama-3.2-3b-instruct:free",
                maxContext: 128000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 16
            },
            {
                id: "nvidia/nemotron-nano-9b-v2:free",
                maxContext: 32000,
                limits: {
                    requestsPerMinute: 20,
                    requestsPerDay: 200,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 17
            },
            {
                id: "meta-llama/llama-3.1-405b-instruct:free",
                maxContext: 16000,
                limits: {
                    requestsPerMinute: 10,
                    requestsPerDay: 100,
                    tokensPerMinute: null,
                    tokensPerDay: null
                },
                priority: 18
            }
        ]
    }
};
