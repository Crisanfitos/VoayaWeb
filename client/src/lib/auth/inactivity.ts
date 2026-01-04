/**
 * Small utilities to manage inactivity timeout and last-activity persistence.
 * Kept minimal and pure to allow unit testing.
 */

export const STORAGE_KEY = 'voaya_last_activity';

/**
 * Parse a timeout value (milliseconds) from a string (e.g., env var).
 * Returns a number of ms, or the provided defaultMs if parsing fails.
 */
export function parseTimeoutMs(envValue: string | undefined, defaultMs = 30 * 60 * 1000): number {
    if (!envValue) return defaultMs;
    const n = Number(envValue);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
    return defaultMs;
}

export function getLastActivity(now = Date.now()): number | null {
    try {
        const v = globalThis.localStorage.getItem(STORAGE_KEY);
        if (!v) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    } catch (e) {
        return null;
    }
}

export function setLastActivity(ts = Date.now()): void {
    try {
        globalThis.localStorage.setItem(STORAGE_KEY, String(ts));
    } catch (e) {
        // ignore
    }
}

/**
 * Compute remaining ms before sign-out given timeout and last activity timestamp.
 * If lastActivity is null, returns timeoutMs.
 */
export function computeRemaining(timeoutMs: number, now = Date.now(), lastActivity: number | null = null): number {
    if (lastActivity === null) return timeoutMs;
    return Math.max(0, timeoutMs - (now - lastActivity));
}
