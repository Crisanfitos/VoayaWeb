// Re-export client firebase implementations from the TSX module.
// Lightweight runtime-safe shim for test environment and module resolution.
// The real client implementation lives in `index.tsx`. This file provides
// minimal exports so imports that resolve to `.../firebase` succeed during
// tests or tooling that prefer `.ts` resolution.

export type User = any;

export const FirebaseClientProvider = ({ children }: { children: any }) => null as any;

export function useAuth(): any {
    return null;
}

export function useUser(): { user: any | null; isUserLoading: boolean } {
    return { user: null, isUserLoading: true };
}

export function useFirestore(): any {
    return null;
}

export function useDoc<T = any>(docRef: any) {
    return { data: null as T | null, isLoading: false };
}

export default null as any;