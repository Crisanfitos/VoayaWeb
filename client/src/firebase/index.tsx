"use client";

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, type DocumentReference, DocumentData, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

type AuthContextType = {
    user: User | null;
    isUserLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isUserLoading: true,
});

export function FirebaseClientProvider({ children }: { children: ReactNode }): JSX.Element {
    const [authState, setAuthState] = useState<AuthContextType>({ user: null, isUserLoading: true });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthState({ user, isUserLoading: false });
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return auth;
}

export function useUser() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useUser must be used within a FirebaseClientProvider');
    }
    return context;
}

export function useFirestore() {
    return firestore;
}

export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!docRef) {
            setData(null);
            setIsLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(docRef, (doc) => {
            setData(doc.exists() ? doc.data() : null);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [docRef]);

    return { data, isLoading };
}

export default app;
