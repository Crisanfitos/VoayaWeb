'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plane, Hotel, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type SearchType = 'flights' | 'hotels' | 'full';

export default function PlanPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [tripDescription, setTripDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('full');

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
    console.log('Trip Description:', tripDescription, 'Search Type:', searchType);
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
  
  const searchOptions = [
    { id: 'flights', label: 'Vuelos', icon: <Plane className="mr-2 h-4 w-4" /> },
    { id: 'hotels', label: 'Hoteles', icon: <Hotel className="mr-2 h-4 w-4" /> },
    { id: 'full', label: 'Completo', icon: <Sparkles className="mr-2 h-4 w-4" /> },
  ] as const;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] bg-background text-center px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          ¡Hola! Soy Voaya. Describe el viaje de tus sueños y te ayudaré a planificarlo.
        </h1>
        
        <div className="flex justify-center gap-2 mb-6">
          {searchOptions.map((option) => (
            <Button
              key={option.id}
              variant={searchType === option.id ? 'default' : 'outline'}
              onClick={() => setSearchType(option.id)}
              className="rounded-full transition-all duration-300 ease-in-out hover:shadow-lg"
            >
              {option.icon}
              {option.label}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="'Un viaje a Japón para 3 personas en verano'"
              value={tripDescription}
              onChange={(e) => setTripDescription(e.target.value)}
              className="h-14 pl-12 pr-4 text-base rounded-full shadow-lg bg-card focus:ring-2 focus:ring-ring transition-transform duration-300 ease-in-out hover:scale-[1.02]"
            />
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="h-12 px-10 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-transform duration-300 ease-in-out disabled:scale-100 enabled:hover:scale-105"
            disabled={isLoading || !tripDescription}
          >
            {isLoading ? <Loader /> : 'Enviar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
