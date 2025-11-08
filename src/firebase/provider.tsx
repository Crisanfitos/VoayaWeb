'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { parseTimeoutMs, STORAGE_KEY, getLastActivity, setLastActivity, computeRemaining } from '../../client/src/firebase/inactivity';
import { FirebaseErrorListener } from '../../client/src/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // Inactivity timeout: sign out user after a period of inactivity.
  // We track last activity in localStorage so the timeout survives page reloads/close-and-open.
  useEffect(() => {
    if (!auth) return; // nothing to do without auth

    // read timeout from public env var (client-side) if provided, else default to 30 minutes
    const timeoutMs = parseTimeoutMs((process as any)?.env?.NEXT_PUBLIC_SESSION_TIMEOUT_MS, 30 * 60 * 1000);
    let signOutTimer: number | null = null;


    const clearTimer = () => {
      if (signOutTimer !== null) {
        window.clearTimeout(signOutTimer);
        signOutTimer = null;
      }
    };

    const scheduleSignOut = (remainingMs: number) => {
      clearTimer();
      // If remaining is already past, sign out immediately
      if (remainingMs <= 0) {
        try {
          signOut(auth).catch(err => console.error('Auto signOut error:', err));
        } catch (e) {
          console.error('Auto signOut error (sync):', e);
        }
        return;
      }

      signOutTimer = window.setTimeout(() => {
        signOut(auth).catch(err => console.error('Auto signOut error:', err));
      }, remainingMs);
    };

    const handleUserActivity = () => {
      setLastActivity();
      scheduleSignOut(timeoutMs);
    };

    // Initialize: check stored last activity. If too old, sign out immediately.
    const last = getLastActivity();
    const now = Date.now();
    const remaining = computeRemaining(timeoutMs, now, last);
    if (remaining <= 0 && last !== null) {
      // expired already
      signOut(auth).catch(err => console.error('Auto signOut on init error:', err));
    } else {
      scheduleSignOut(remaining);
    }

    // Listen for typical activity events
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, handleUserActivity));
    // update activity when page becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleUserActivity();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // store activity timestamp on unload so next session knows last active time
    const handleBeforeUnload = () => setLastActivity();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimer();
      events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [auth]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);

  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};