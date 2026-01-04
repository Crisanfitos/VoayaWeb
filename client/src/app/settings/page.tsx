'use client';

import { useUser, useDoc, useAuth } from '@/lib/auth'; // Now Supabase powered
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { updateDocumentNonBlocking } from '@/lib/auth/non-blocking-updates';
import { reauthenticateAndChangePassword, deleteUserAccount } from '@/lib/auth/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  nombre: string;
  apellidos: string;
  email: string;
  moneda_preferida: string;
}

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  email: z.string().email(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().optional(), // Supabase doesn't strict require current password for update if session is active usually, but depends on security settings. We will try simple update.
  newPassword: z.string().min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las nuevas contraseñas no coinciden.',
  path: ['confirmPassword'],
});

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth(); // Helper returning supabase.auth
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // useDoc now expects (table, id)
  const { data: userProfile, isLoading: isProfileLoading } = useDoc('usuarios', user?.id);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        firstName: userProfile.nombre || '',
        lastName: userProfile.apellidos || '',
        email: user?.email || '',
      });
    }
  }, [userProfile, user, profileForm]);

  const handleProfileUpdate = (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    updateDocumentNonBlocking('usuarios', user.id, {
      nombre: values.firstName,
      apellidos: values.lastName,
    });
    toast({
      title: 'Perfil Actualizado',
      description: 'Tu información de perfil ha sido actualizada.',
    });
  };

  const handlePasswordChange = (values: z.infer<typeof passwordFormSchema>) => {
    if (!auth || !user) return;
    // We pass auth (supabase.auth) and user/newPassword
    reauthenticateAndChangePassword(auth, user, values.currentPassword || '', values.newPassword);
    passwordForm.reset();
  };

  const handleDeleteAccount = () => {
    if (!auth || !user) return;
    setIsDeleting(true);
    deleteUserAccount(auth, user);
  };

  if (isUserLoading || isProfileLoading || isDeleting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Configuración</h1>

        <Card>
          <CardHeader>
            <CardTitle>Información del Perfil</CardTitle>
            <CardDescription>
              Actualiza tu información personal. Tu email no puede ser modificado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!userProfile && !isProfileLoading && (
              <p className="text-sm text-destructive">Faltan datos personales. Por favor, completa tu perfil.</p>
            )}
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl>
                        <Input placeholder="Tus apellidos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Guardar Cambios</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>
              Asegúrate de usar una contraseña segura.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                {/* Removed Current Password Requirement Visual if we want to simplify, but keeping field for now */}
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña Actual (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Actualizar Contraseña</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Separator />

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
            <CardDescription>
              La eliminación de tu cuenta es una acción irreversible y no se puede deshacer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Eliminar Cuenta</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente tu
                    cuenta y todos tus datos de nuestros servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Sí, eliminar mi cuenta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
