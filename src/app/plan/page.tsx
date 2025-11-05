'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Loader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plane, Hotel, Sparkles, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';


type SearchCategory = 'flights' | 'hotels' | 'experiences';
type SearchType = SearchCategory | 'full';

export default function PlanPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [tripDescription, setTripDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<SearchCategory>>(
    new Set(['flights', 'hotels', 'experiences'])
  );

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSearchTypeToggle = (category: SearchCategory) => {
    setSelectedCategories(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(category)) {
        // Prevent deselecting the last item
        if (newSelection.size > 1) {
          newSelection.delete(category);
        }
      } else {
        newSelection.add(category);
      }
      return newSelection;
    });
  };

  const handleFullSearchClick = () => {
    if (selectedCategories.size === 3) {
        // If all are selected, and we click full again, do nothing to prevent full deselection.
        // Or, we could decide to toggle to just one, e.g., flights. For now, we do nothing.
    } else {
        setSelectedCategories(new Set(['flights', 'hotels', 'experiences']));
    }
  };

  const isFullSearch = selectedCategories.size === 3;

  const placeholders: { [key: string]: string } = {
    'flights': "'Un vuelo a Bali para 2 personas en diciembre'",
    'hotels': "'Hoteles de 5 estrellas en Roma con piscina'",
    'experiences': "'Ruta del vino en la Toscana'",
    'flights,hotels': "'Vuelo y hotel para una escapada a París el próximo fin de semana'",
    'flights,experiences': "'Vuelos a Costa Rica y tour por la selva'",
    'hotels,experiences': "'Hotel boutique en Kioto y una clase de ceremonia del té'",
    'flights,hotels,experiences': "'Un viaje completo a Japón para 3 personas en verano'",
  };

  const placeholderKey = useMemo(() => {
    const sortedCategories = Array.from(selectedCategories).sort().join(',');
    return sortedCategories;
  }, [selectedCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDescription) return;
    setIsLoading(true);
    // We will implement the chat logic in the next step
    console.log('Trip Description:', tripDescription, 'Search Categories:', Array.from(selectedCategories));
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
    { id: 'experiences', label: 'Experiencias', icon: <Mountain className="mr-2 h-4 w-4" /> },
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
              variant={selectedCategories.has(option.id) ? 'default' : 'outline'}
              onClick={() => handleSearchTypeToggle(option.id)}
              className="rounded-full transition-all duration-300 ease-in-out hover:shadow-lg"
            >
              {option.icon}
              {option.label}
            </Button>
          ))}
           <Button
              key="full"
              variant={isFullSearch ? 'default' : 'outline'}
              onClick={handleFullSearchClick}
              className="rounded-full transition-all duration-300 ease-in-out hover:shadow-lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Completo
            </Button>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <div className="relative w-full">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={placeholderKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                     <Input
                        type="text"
                        readOnly
                        placeholder={placeholders[placeholderKey]}
                        className="h-14 pl-12 pr-4 text-base rounded-full shadow-lg bg-transparent border-none placeholder:text-muted-foreground placeholder:transition-opacity placeholder:duration-300"
                    />
                  </motion.div>
                </AnimatePresence>
                <Input
                    type="text"
                    value={tripDescription}
                    onChange={(e) => setTripDescription(e.target.value)}
                    className="relative h-14 pl-12 pr-4 text-base rounded-full shadow-lg bg-card focus:ring-2 focus:ring-ring transition-transform duration-300 ease-in-out hover:scale-[1.02] placeholder:text-transparent"
                />
            </div>
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
