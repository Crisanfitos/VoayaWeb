'use client';

/**
 * Utility functions for managing cookies in the client
 */

export const COOKIES = {
    USER_ID: 'voaya_user_id',
    CHAT_ID: 'voaya_chat_id',
} as const;

/**
 * Set a cookie value
 */
export function setCookie(name: string, value: string, options?: { maxAge?: number }) {
    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (options?.maxAge) {
        cookieString += `; max-age=${options.maxAge}`;
    } else {
        // Default: 7 days
        cookieString += '; max-age=604800';
    }

    cookieString += '; path=/';
    cookieString += '; samesite=lax';

    document.cookie = cookieString;
}

/**
 * Get a cookie value
 */
export function getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(nameEQ)) {
            return decodeURIComponent(trimmed.substring(nameEQ.length));
        }
    }

    return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string) {
    setCookie(name, '', { maxAge: -1 });
}

/**
 * Save userId to cookies (called on login/signup)
 */
export function saveUserIdToCookie(userId: string) {
    setCookie(COOKIES.USER_ID, userId, { maxAge: 2592000 }); // 30 days
}

/**
 * Get userId from cookies
 */
export function getUserIdFromCookie(): string | null {
    return getCookie(COOKIES.USER_ID);
}

/**
 * Save chatId to cookies
 */
export function saveChatIdToCookie(chatId: string) {
    setCookie(COOKIES.CHAT_ID, chatId, { maxAge: 604800 }); // 7 days
}

/**
 * Get chatId from cookies
 */
export function getChatIdFromCookie(): string | null {
    return getCookie(COOKIES.CHAT_ID);
}

/**
 * Clear all voaya cookies (called on logout)
 */
export function clearVoayaCookies() {
    deleteCookie(COOKIES.USER_ID);
    deleteCookie(COOKIES.CHAT_ID);
}
