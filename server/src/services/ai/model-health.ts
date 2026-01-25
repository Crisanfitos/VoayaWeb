/**
 * Model Health Manager
 * Tracks the health status of AI models with error categorization and auto-disable logic.
 */

import type { Provider } from './types';

// Error severity levels
export type ErrorSeverity = 'light' | 'medium' | 'severe';

// Error entry with timestamp for hourly tracking
export interface ErrorEntry {
    timestamp: Date;
    severity: ErrorSeverity;
    code: number;
    message: string;
}

// Model health status
export interface ModelHealth {
    provider: Provider;
    modelId: string;
    status: 'available' | 'degraded' | 'disabled';
    errors: {
        light: number;    // Rate limits (429)
        medium: number;   // Server errors (500, 502, 503, timeout)
        severe: number;   // Model not found (404)
    };
    lastError?: ErrorEntry;
    totalCalls: number;
    successfulCalls: number;
    hourlyErrors: ErrorEntry[];  // For tracking errors in the last hour
    disabledAt?: Date;
    disableReason?: string;
}

// All models health data
type HealthData = Record<string, ModelHealth>;  // key: "provider:modelId"

// Constants
const HOURLY_ERROR_LIMIT = 1000;  // Max medium errors per hour before disabling
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes

class ModelHealthManager {
    private health: HealthData = {};
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Start periodic cleanup
        this.startCleanupRoutine();
    }

    /**
     * Get unique key for a model
     */
    private getKey(provider: Provider, modelId: string): string {
        return `${provider}:${modelId}`;
    }

    /**
     * Initialize or get health record for a model
     */
    private getOrCreateHealth(provider: Provider, modelId: string): ModelHealth {
        const key = this.getKey(provider, modelId);
        if (!this.health[key]) {
            this.health[key] = {
                provider,
                modelId,
                status: 'available',
                errors: { light: 0, medium: 0, severe: 0 },
                totalCalls: 0,
                successfulCalls: 0,
                hourlyErrors: []
            };
        }
        return this.health[key];
    }

    /**
     * Categorize error by HTTP status code
     */
    categorizeError(statusCode: number, errorMessage: string): ErrorSeverity {
        // 404 = Model not found = SEVERE (disable immediately)
        if (statusCode === 404) {
            return 'severe';
        }
        // 429 = Rate limit = LIGHT (just track, expected behavior)
        if (statusCode === 429) {
            return 'light';
        }
        // 500, 502, 503, 504 = Server errors = MEDIUM
        if (statusCode >= 500 && statusCode < 600) {
            return 'medium';
        }
        // Timeout or network errors
        if (errorMessage.toLowerCase().includes('timeout') ||
            errorMessage.toLowerCase().includes('network') ||
            errorMessage.toLowerCase().includes('econnrefused')) {
            return 'medium';
        }
        // Default to medium for unknown errors
        return 'medium';
    }

    /**
     * Record an error for a model
     */
    recordError(provider: Provider, modelId: string, statusCode: number, errorMessage: string): void {
        const health = this.getOrCreateHealth(provider, modelId);
        const severity = this.categorizeError(statusCode, errorMessage);

        const errorEntry: ErrorEntry = {
            timestamp: new Date(),
            severity,
            code: statusCode,
            message: errorMessage.slice(0, 200)  // Truncate long messages
        };

        // Update error counts
        health.errors[severity]++;
        health.lastError = errorEntry;
        health.hourlyErrors.push(errorEntry);

        console.log(`[ModelHealth] ${provider}/${modelId} - ${severity.toUpperCase()} error (${statusCode}): ${errorMessage.slice(0, 100)}`);

        // Handle based on severity
        if (severity === 'severe') {
            // Immediate disable for 404 (model doesn't exist)
            this.disableModel(provider, modelId, `Model not found (404): ${errorMessage.slice(0, 100)}`);
        } else if (severity === 'medium') {
            // Check hourly error limit
            this.checkHourlyLimit(provider, modelId);
        }
        // Light errors (429) are just tracked, no action needed
    }

    /**
     * Record a successful call
     */
    recordSuccess(provider: Provider, modelId: string): void {
        const health = this.getOrCreateHealth(provider, modelId);
        health.totalCalls++;
        health.successfulCalls++;

        // If model was degraded, check if it can be restored
        if (health.status === 'degraded') {
            const recentErrors = this.getHourlyErrorCount(provider, modelId, 'medium');
            if (recentErrors < HOURLY_ERROR_LIMIT / 2) {
                health.status = 'available';
                console.log(`[ModelHealth] ${provider}/${modelId} restored to available`);
            }
        }
    }

    /**
     * Get count of errors in the last hour for a specific severity
     */
    private getHourlyErrorCount(provider: Provider, modelId: string, severity: ErrorSeverity): number {
        const key = this.getKey(provider, modelId);
        const health = this.health[key];
        if (!health) return 0;

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return health.hourlyErrors.filter(e =>
            e.timestamp > oneHourAgo && e.severity === severity
        ).length;
    }

    /**
     * Check if model has exceeded hourly error limit
     */
    private checkHourlyLimit(provider: Provider, modelId: string): void {
        const hourlyMediumErrors = this.getHourlyErrorCount(provider, modelId, 'medium');

        if (hourlyMediumErrors >= HOURLY_ERROR_LIMIT) {
            this.disableModel(provider, modelId, `Exceeded ${HOURLY_ERROR_LIMIT} errors in the last hour`);
        } else if (hourlyMediumErrors >= HOURLY_ERROR_LIMIT / 2) {
            // Mark as degraded
            const health = this.getOrCreateHealth(provider, modelId);
            if (health.status === 'available') {
                health.status = 'degraded';
                console.log(`[ModelHealth] ${provider}/${modelId} marked as DEGRADED (${hourlyMediumErrors} errors/hour)`);
            }
        }
    }

    /**
     * Disable a model
     */
    private disableModel(provider: Provider, modelId: string, reason: string): void {
        const health = this.getOrCreateHealth(provider, modelId);
        health.status = 'disabled';
        health.disabledAt = new Date();
        health.disableReason = reason;
        console.log(`[ModelHealth] ⛔ ${provider}/${modelId} DISABLED: ${reason}`);
    }

    /**
     * Check if a model is available for use
     */
    isModelAvailable(provider: Provider, modelId: string): boolean {
        const key = this.getKey(provider, modelId);
        const health = this.health[key];

        // If no health record, model is available (first use)
        if (!health) return true;

        // Only allow 'available' or 'degraded' models
        return health.status !== 'disabled';
    }

    /**
     * Get all health data for monitoring dashboard
     */
    getAllHealth(): ModelHealth[] {
        return Object.values(this.health);
    }

    /**
     * Get summary stats
     */
    getSummary(): {
        total: number;
        available: number;
        degraded: number;
        disabled: number;
        totalCalls: number;
        totalErrors: number;
    } {
        const models = Object.values(this.health);
        return {
            total: models.length,
            available: models.filter(m => m.status === 'available').length,
            degraded: models.filter(m => m.status === 'degraded').length,
            disabled: models.filter(m => m.status === 'disabled').length,
            totalCalls: models.reduce((sum, m) => sum + m.totalCalls, 0),
            totalErrors: models.reduce((sum, m) => sum + m.errors.light + m.errors.medium + m.errors.severe, 0)
        };
    }

    /**
     * Cleanup old error entries and check limits
     */
    private cleanup(): void {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        for (const health of Object.values(this.health)) {
            // Remove old hourly errors
            health.hourlyErrors = health.hourlyErrors.filter(e => e.timestamp > oneHourAgo);
        }
    }

    /**
     * Start periodic cleanup routine
     */
    private startCleanupRoutine(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, CLEANUP_INTERVAL_MS);
    }

    /**
     * Stop cleanup routine (for testing/shutdown)
     */
    stopCleanupRoutine(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

export const modelHealth = new ModelHealthManager();
