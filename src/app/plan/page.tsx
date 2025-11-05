'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function PlanPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [tripDescription, setTripDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDescription) return;
    setIsLoading(true);
    // We will implement the chat logic in the next step
    console.log('Trip Description:', tripDescription);
    // For now, just simulate a network request
    setTimeout(() => {
        setIsLoading(false);
    }, 2000);
  };

  if (isUserLoading) {
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] bg-background text-center px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          ¡Hola! Soy Voaya. Describe el viaje de tus sueños y te ayudaré a planificarlo.
        </h1>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="'Un viaje a Japón para 3 personas en verano'"
              value={tripDescription}
              onChange={(e) => setTripDescription(e.target.value)}
              className="h-14 pl-12 pr-4 text-base rounded-full shadow-lg bg-card focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="h-12 px-10 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={isLoading || !tripDescription}
          >
            {isLoading ? <Loader /> : 'Enviar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
