/**
 * Token Estimator
 * Approximates token count for messages to help with model selection and limit tracking
 */

import type { ChatMessage } from './types';

/**
 * Approximate token estimation based on characters.
 * Rule: ~1 token per 3 characters (conservative for Spanish/multilingual)
 */
export function estimateTokens(text: string): number {
    if (!text || text.length === 0) return 0;

    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;

    // Conservative: ~1.3 tokens per word or ~1 token per 3 chars (take higher)
    const byWords = Math.ceil(words * 1.3);
    const byChars = Math.ceil(chars / 3);

    return Math.max(byWords, byChars);
}

/**
 * Estimates total tokens for an array of messages.
 * Includes ~4 token overhead per message for format/metadata.
 */
export function estimateMessagesTokens(messages: ChatMessage[]): number {
    let total = 0;

    for (const msg of messages) {
        total += estimateTokens(msg.content) + 4;
    }

    // Add 10% buffer for safety
    return Math.ceil(total * 1.1);
}
