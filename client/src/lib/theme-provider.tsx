"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useDoc } from '@/lib/auth';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: ThemeMode) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolvedTheme: 'light' | 'dark') {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const { data: userProfile } = useDoc('usuarios', user?.id);

    const [theme, setThemeState] = useState<ThemeMode>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
    const [isLoading, setIsLoading] = useState(true);

    // Load theme from localStorage first (for immediate apply), then from user profile
    useEffect(() => {
        // First, try localStorage for immediate theme
        const storedTheme = localStorage.getItem('voaya-theme') as ThemeMode | null;
        if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
            setThemeState(storedTheme);
        }
        setIsLoading(false);
    }, []);

    // Sync with user profile theme when it loads
    useEffect(() => {
        if (userProfile?.tema_modo) {
            const dbTheme = userProfile.tema_modo as ThemeMode;
            if (['light', 'dark', 'system'].includes(dbTheme)) {
                setThemeState(dbTheme);
                localStorage.setItem('voaya-theme', dbTheme);
            }
        }
    }, [userProfile]);

    // Resolve and apply theme
    useEffect(() => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        setResolvedTheme(resolved);
        applyTheme(resolved);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? 'dark' : 'light';
            setResolvedTheme(resolved);
            applyTheme(resolved);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        localStorage.setItem('voaya-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
