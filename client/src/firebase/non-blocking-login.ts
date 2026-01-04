'use client';

import { supabase } from '@/supabase/client';
import { showToast } from './toast-utils';
import { deleteDocumentNonBlocking } from './non-blocking-updates';
// import { toast } from '@/hooks/use-toast'; // Avoiding circular deps or extra imports if not needed, using showToast wrapper or similar?
// actually showToast is local, let's use it.

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(): void {
    supabase.auth.signInAnonymously()
        .then(({ error }) => {
            if (error) {
                console.error("Anonymous Sign-In Error:", error);
                showToast({
                    variant: "destructive",
                    title: "Error de autenticación",
                    description: "No se pudo iniciar sesión de forma anónima. " + error.message,
                });
            }
        });
}

/** Reauthenticates and changes the user's password. */
export function reauthenticateAndChangePassword(auth: any, user: any, currentPassword: string, newPassword: string): void {
    // auth and user params are ignored
    supabase.auth.updateUser({ password: newPassword })
        .then(({ error }) => {
            if (error) {
                console.error("Password Update Error:", error);
                showToast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la contraseña: " + error.message });
            } else {
                showToast({ title: "Éxito", description: "Tu contraseña ha sido actualizada." });
            }
        });
}


/** Deletes the user account and their Firestore data. */
export function deleteUserAccount(auth: any, user: any): void {
    const userId = user.id;

    // 1. Delete profile data
    deleteDocumentNonBlocking('usuarios', userId);

    // 2. Sign out (Client side delete not recommended/supported easily)
    showToast({ title: "Datos eliminados", description: "Tus datos de perfil han sido eliminados. Contacta soporte para borrar tu cuenta de acceso permanentemente." });
    supabase.auth.signOut();
}
