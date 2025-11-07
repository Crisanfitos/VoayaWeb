'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  deleteUser,
  User,
} from 'firebase/auth';
import { showToast } from './toast-utils';
import { getFirestore, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from './non-blocking-updates';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(error => {
    console.error("Anonymous Sign-In Error:", error);
    showToast({
      variant: "destructive",
      title: "Error de autenticación",
      description: "No se pudo iniciar sesión de forma anónima. " + error.message,
    });
  });
}

type UserProfileData = {
  firstName: string;
  lastName: string;
  preferredCurrency: string;
};

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, profileData: UserProfileData): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      const firestore = getFirestore(authInstance.app);
      const userProfileRef = doc(firestore, `users/${user.uid}`);

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
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
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
}

/** Reauthenticates and changes the user's password. */
export function reauthenticateAndChangePassword(auth: Auth, user: User, currentPassword: string, newPassword: string): void {
  if (!user.email) {
    showToast({ variant: "destructive", title: "Error", description: "No se encontró el email del usuario." });
    return;
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);

  reauthenticateWithCredential(user, credential)
    .then(() => {
      updatePassword(user, newPassword)
        .then(() => {
          toast({ title: "Éxito", description: "Tu contraseña ha sido actualizada." });
        })
        .catch(error => {
          console.error("Password Update Error:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la contraseña: " + error.message });
        });
    })
    .catch(error => {
      console.error("Reauthentication Error:", error);
      let description = "Ocurrió un error al verificar tu identidad.";
      if (error.code === 'auth/wrong-password') {
        description = 'La contraseña actual es incorrecta.';
      }
      toast({ variant: "destructive", title: "Error de Autenticación", description });
    });
}


/** Deletes the user account and their Firestore data. */
export function deleteUserAccount(auth: Auth, user: User): void {
  const firestore = getFirestore(auth.app);
  const userDocRef = doc(firestore, `users/${user.uid}`);

  // First, delete the Firestore document.
  deleteDocumentNonBlocking(userDocRef);

  // Then, delete the user from Authentication.
  deleteUser(user)
    .then(() => {
      toast({ title: "Cuenta Eliminada", description: "Tu cuenta ha sido eliminada permanentemente." });
      // The useUser hook and page logic will handle redirection.
    })
    .catch(error => {
      console.error("Delete Account Error:", error);
      let description = "Ocurrió un error al eliminar tu cuenta.";
      // If re-authentication is needed
      if (error.code === 'auth/requires-recent-login') {
        description = "Esta operación es sensible y requiere autenticación reciente. Por favor, inicia sesión de nuevo e inténtalo otra vez.";
      }
      toast({ variant: "destructive", title: "Error de Eliminación", description });
    });
}