import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseConfig } from './config';
import { createContext, useContext, useEffect, useState } from 'react';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Auth context
const AuthContext = createContext<{
    user: User | null;
    loading: boolean;
}>({
    user: null,
    loading: true,
});

// Provider component
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value= {{ user, loading }
}>
    { children }
    </AuthContext.Provider>
  );
}

// Custom hooks
export const useAuth = () => {
    return auth;
};

export const useUser = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a FirebaseClientProvider');
    }
    return context;
};