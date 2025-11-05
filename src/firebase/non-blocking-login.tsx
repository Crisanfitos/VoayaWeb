'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { getFirestore, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from './non-blocking-updates';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch(error => {
    console.error("Anonymous Sign-In Error:", error);
    toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "No se pudo iniciar sesión de forma anónima. " + error.message,
    });
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

type UserProfileData = {
    firstName: string;
    lastName: string;
    preferredCurrency: string;
};

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, profileData: UserProfileData): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
        const user = userCredential.user;
        const firestore = getFirestore(authInstance.app);
        const userProfileRef = doc(firestore, `users/${user.uid}/profile`);

        const newProfile = {
            id: user.uid,
            email: user.email,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            preferredCurrency: profileData.preferredCurrency,
            dateJoined: new Date().toISOString(),
        };

        setDocumentNonBlocking(userProfileRef, newProfile, { merge: true });
    })
    .catch(error => {
        console.error("Sign-Up Error:", error);
        let description = "Ocurrió un error durante el registro.";
        if (error.code === 'auth/email-already-in-use') {
            description = 'Este correo electrónico ya está en uso. Por favor, intenta con otro.';
        } else if (error.code === 'auth/weak-password') {
            description = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
        }
        toast({
            variant: "destructive",
            title: "Error al crear cuenta",
            description: description,
        });
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password)
    .catch(error => {
        console.error("Sign-In Error:", error);
        let description = "Ocurrió un error al iniciar sesión.";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            description = 'Las credenciales son incorrectas. Por favor, verifica tu correo y contraseña.';
        }
        toast({
            variant: "destructive",
            title: "Error de inicio de sesión",
            description: description,
        });
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
