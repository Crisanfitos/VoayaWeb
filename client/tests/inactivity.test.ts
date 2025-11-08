import { describe, it, expect, beforeEach } from 'vitest';
import { parseTimeoutMs, computeRemaining, STORAGE_KEY, getLastActivity, setLastActivity } from '../src/firebase/inactivity';

// jsdom provides localStorage

describe('inactivity helpers', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('parseTimeoutMs returns default when env missing or invalid', () => {
        expect(parseTimeoutMs(undefined, 5000)).toBe(5000);
        expect(parseTimeoutMs('not-a-number', 6000)).toBe(6000);
    });

    it('parseTimeoutMs parses numeric strings', () => {
        expect(parseTimeoutMs('30000', 6000)).toBe(30000);
    });

    it('set/get last activity works', () => {
        const before = Date.now();
        setLastActivity(before);
        const v = getLastActivity();
        expect(v).toBeGreaterThanOrEqual(before - 10);
        expect(v).toBeLessThanOrEqual(Date.now());
    });

    it('computeRemaining when no last returns full timeout', () => {
        expect(computeRemaining(10000, 50000, null)).toBe(10000);
    });

    it('computeRemaining returns zero if expired', () => {
        const timeout = 10000;
        const now = 20000;
        const last = 5000; // elapsed = 15000 > timeout
        expect(computeRemaining(timeout, now, last)).toBe(0);
    });

    it('computeRemaining returns remaining time when not expired', () => {
        const timeout = 10000;
        const now = 15000;
        const last = 8000; // elapsed 7000 => remaining 3000
        expect(computeRemaining(timeout, now, last)).toBe(3000);
    });
});
