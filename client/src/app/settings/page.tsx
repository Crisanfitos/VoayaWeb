'use client';

import { useUser, useDoc, useAuth } from '@/lib/auth';
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
import Link from 'next/link';

type SidebarTab = 'profile' | 'security' | 'preferences' | 'notifications' | 'subscription';

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  email: z.string().email(),
  bio: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las nuevas contraseñas no coinciden.',
  path: ['confirmPassword'],
});

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('profile');

  // AI Preferences state
  const [aiPreferences, setAiPreferences] = useState({
    adventure: 75,
    luxury: 40,
    nature: 60,
    spontaneous: 20,
  });

  const { data: userProfile, isLoading: isProfileLoading } = useDoc('usuarios', user?.id);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      bio: '',
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
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile, user, profileForm]);

  const handleProfileUpdate = (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    updateDocumentNonBlocking('usuarios', user.id, {
      nombre: values.firstName,
      apellidos: values.lastName,
      bio: values.bio,
    });
    toast({
      title: 'Perfil Actualizado',
      description: 'Tu información de perfil ha sido actualizada.',
    });
  };

  const handlePasswordChange = (values: z.infer<typeof passwordFormSchema>) => {
    if (!auth || !user) return;
    reauthenticateAndChangePassword(auth, user, values.currentPassword || '', values.newPassword);
    passwordForm.reset();
    toast({
      title: 'Contraseña Actualizada',
      description: 'Tu contraseña ha sido cambiada exitosamente.',
    });
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

  const sidebarItems = [
    { id: 'profile' as const, label: 'Mi Perfil', icon: 'person' },
    { id: 'security' as const, label: 'Seguridad', icon: 'security' },
    { id: 'preferences' as const, label: 'Preferencias de Viaje', icon: 'tune' },
    { id: 'notifications' as const, label: 'Notificaciones', icon: 'notifications' },
    { id: 'subscription' as const, label: 'Suscripción', icon: 'credit_card' },
  ];

  return (
    <div className="flex flex-1 max-w-[1440px] mx-auto w-full min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex w-72 flex-col gap-6 p-6 border-r border-stroke dark:border-input-dark bg-white dark:bg-background-dark">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-main dark:text-white text-lg font-bold">Cuenta</h1>
          <p className="text-text-secondary dark:text-text-muted text-sm">Gestionar ajustes</p>
        </div>

        <nav className="flex flex-col gap-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                  ? 'bg-voaya-primary text-white shadow-md shadow-voaya-primary/20'
                  : 'text-text-secondary dark:text-text-muted hover:bg-slate-50 dark:hover:bg-input-dark hover:text-voaya-primary'
                }`}
            >
              <span className={`material-symbols-outlined ${activeTab === item.id ? 'fill' : ''}`}>
                {item.icon}
              </span>
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary dark:text-text-muted hover:bg-slate-50 dark:hover:bg-input-dark hover:text-voaya-primary transition-all"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="text-sm font-medium">Ayuda y Soporte</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 flex flex-col gap-8 max-w-4xl bg-background-light dark:bg-background">
        {/* Page Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-text-main dark:text-white">
            Configuración de Perfil
          </h1>
          <p className="text-text-secondary dark:text-text-muted text-lg">
            Gestiona tu información personal y ajusta la IA de viaje.
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-stroke dark:border-input-dark shadow-soft">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="size-24 rounded-full bg-gradient-to-br from-voaya-primary to-blue-400 flex items-center justify-center text-white shadow-xl border-4 border-white dark:border-input-dark">
              <span className="material-symbols-outlined text-4xl">person</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-text-main dark:text-white">
                {userProfile?.nombre || 'Usuario'} {userProfile?.apellidos || ''}
              </h2>
              <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
                <span className="bg-voaya-primary/10 text-voaya-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-voaya-primary/20">
                  Viajero Pro
                </span>
                <span className="text-text-secondary dark:text-text-muted text-sm">
                  Miembro desde 2024
                </span>
              </div>
            </div>
          </div>
          <button className="bg-white dark:bg-surface-darker hover:bg-slate-50 dark:hover:bg-input-dark text-text-main dark:text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all border border-stroke dark:border-input-dark shadow-sm hover:shadow-md hover:-translate-y-0.5">
            Cambiar Foto
          </button>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 pb-2 border-b border-stroke dark:border-input-dark">
              <span className="material-symbols-outlined text-voaya-primary">badge</span>
              <h3 className="text-lg font-bold text-text-main dark:text-white">Información Personal</h3>
            </div>

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="flex flex-col gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-text-secondary dark:text-text-muted">
                        Nombre
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white dark:bg-input-dark border border-stroke dark:border-transparent focus:border-voaya-primary focus:ring-1 focus:ring-voaya-primary rounded-lg px-4 py-3 text-text-main dark:text-white outline-none transition-all shadow-sm"
                        />
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
                      <FormLabel className="text-sm font-semibold text-text-secondary dark:text-text-muted">
                        Apellidos
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white dark:bg-input-dark border border-stroke dark:border-transparent focus:border-voaya-primary focus:ring-1 focus:ring-voaya-primary rounded-lg px-4 py-3 text-text-main dark:text-white outline-none transition-all shadow-sm"
                        />
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
                      <FormLabel className="text-sm font-semibold text-text-secondary dark:text-text-muted">
                        Correo Electrónico
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          className="bg-slate-100 dark:bg-input-dark/50 border border-stroke dark:border-transparent rounded-lg px-4 py-3 text-text-muted outline-none cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-text-secondary dark:text-text-muted">
                        Bio de Viajero (Para la IA)
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={4}
                          placeholder="Describe qué tipo de viajero eres..."
                          className="w-full bg-white dark:bg-input-dark border border-stroke dark:border-transparent focus:border-voaya-primary focus:ring-1 focus:ring-voaya-primary rounded-lg px-4 py-3 text-text-main dark:text-white placeholder:text-text-muted outline-none transition-all resize-none shadow-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-fit mt-2 bg-voaya-primary hover:bg-voaya-primary-dark text-white font-bold rounded-lg px-6 py-2.5">
                  Guardar Cambios
                </Button>
              </form>
            </Form>
          </div>

          {/* AI Preferences Tuning */}
          <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between pb-2 border-b border-stroke dark:border-input-dark">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-voaya-primary">auto_awesome</span>
                <h3 className="text-lg font-bold text-text-main dark:text-white">Ajustes de IA</h3>
              </div>
            </div>

            {/* AI Tip Box */}
            <div className="bg-blue-50 dark:bg-voaya-primary/10 border border-blue-100 dark:border-voaya-primary/20 rounded-lg p-4 flex gap-3 items-start shadow-sm">
              <span className="material-symbols-outlined text-voaya-primary text-xl mt-0.5 fill">lightbulb</span>
              <div>
                <p className="text-text-main dark:text-white font-bold text-sm">Consejo de Voaya AI</p>
                <p className="text-text-secondary dark:text-text-muted text-xs mt-1 leading-relaxed">
                  Notamos que disfrutas de climas cálidos. Ajustar tu preferencia hacia &quot;Playa&quot; mejorará tus recomendaciones en un 30%.
                </p>
              </div>
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-6 bg-white dark:bg-surface-dark p-4 rounded-xl border border-stroke dark:border-input-dark shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm font-bold text-text-secondary dark:text-text-muted">
                  <span>Relax</span>
                  <span>Aventura</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiPreferences.adventure}
                  onChange={(e) => setAiPreferences({ ...aiPreferences, adventure: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm font-bold text-text-secondary dark:text-text-muted">
                  <span>Económico</span>
                  <span>Lujo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiPreferences.luxury}
                  onChange={(e) => setAiPreferences({ ...aiPreferences, luxury: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm font-bold text-text-secondary dark:text-text-muted">
                  <span>Naturaleza</span>
                  <span>Ciudad</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiPreferences.nature}
                  onChange={(e) => setAiPreferences({ ...aiPreferences, nature: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm font-bold text-text-secondary dark:text-text-muted">
                  <span>Planificado</span>
                  <span>Espontáneo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiPreferences.spontaneous}
                  onChange={(e) => setAiPreferences({ ...aiPreferences, spontaneous: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="flex flex-col gap-6 md:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-xl border border-stroke dark:border-input-dark shadow-soft">
            <div className="flex items-center gap-2 pb-2 border-b border-stroke/50 dark:border-input-dark">
              <span className="material-symbols-outlined text-text-secondary">lock</span>
              <h3 className="text-lg font-bold text-text-main dark:text-white">Seguridad de la Cuenta</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
              <div className="flex flex-col gap-1">
                <h4 className="text-text-main dark:text-white font-bold">Autenticación de dos factores (2FA)</h4>
                <p className="text-text-secondary dark:text-text-muted text-sm">
                  Añade una capa extra de seguridad a tu cuenta.
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="relative w-11 h-6 bg-slate-200 dark:bg-input-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-voaya-primary shadow-inner"></div>
                <span className="ms-3 text-sm font-medium text-text-main dark:text-white">Activado</span>
              </label>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full">
              <button className="flex-1 bg-white dark:bg-surface-darker hover:bg-slate-50 dark:hover:bg-input-dark text-text-main dark:text-white px-4 py-3 rounded-lg text-sm font-bold transition-all border border-stroke dark:border-input-dark shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-text-muted">
                Cambiar Contraseña
              </button>
              <button className="flex-1 bg-white dark:bg-surface-darker hover:bg-slate-50 dark:hover:bg-input-dark text-text-main dark:text-white px-4 py-3 rounded-lg text-sm font-bold transition-all border border-stroke dark:border-input-dark shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-text-muted">
                Dispositivos Conectados
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="flex flex-col gap-6 md:col-span-2 bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-200 dark:border-red-900/30">
            <div className="flex items-center gap-2 pb-2 border-b border-red-200 dark:border-red-900/30">
              <span className="material-symbols-outlined text-red-600">warning</span>
              <h3 className="text-lg font-bold text-red-600">Zona de Peligro</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex flex-col gap-1">
                <h4 className="text-text-main dark:text-white font-bold">Eliminar Cuenta</h4>
                <p className="text-text-secondary dark:text-text-muted text-sm">
                  La eliminación de tu cuenta es irreversible y no se puede deshacer.
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-bold">
                    Eliminar Cuenta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta y todos tus datos de nuestros servidores.
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
