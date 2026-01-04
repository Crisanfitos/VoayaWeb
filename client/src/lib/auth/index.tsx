"use client";

import { supabase } from '../../supabase/client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isUserLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isUserLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const [authState, setAuthState] = useState<AuthContextType>({
        user: null,
        session: null,
        isUserLoading: true
    });

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthState({
                user: session?.user ?? null,
                session: session,
                isUserLoading: false
            });
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setAuthState({
                user: session?.user ?? null,
                session: session,
                isUserLoading: false
            });
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return supabase.auth;
}

export function useUser() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useUser must be used within a AuthProvider');
    }
    return context;
}

export function useSupabase() {
    return supabase;
}

// Adapted useDoc for Supabase
export function useDoc(table: string, id: string | undefined | null) {
    const [data, setData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id || !table) {
            setData(null);
            setIsLoading(false);
            return;
        }

        async function fetchData() {
            setIsLoading(true);
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error(`Error fetching ${table} ${id}:`, error);
                setData(null);
            } else {
                setData(data);
            }
            setIsLoading(false);
        }

        fetchData();

    }, [table, id]);

    return { data, isLoading };
}

// Helper to keep compatibility if needed, though we should remove them eventually.
export type { User };
