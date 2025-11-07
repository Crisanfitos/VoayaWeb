'use client';

import { useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { Loader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plane, Hotel, Mountain } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatView from '@/components/chat/chat-view';
import { TravelPlan } from '@/types';
import { generatePlan } from '@/app/actions/chat-actions';

type SearchCategory = 'flights' | 'hotels' | 'experiences';

function PlanPageComponent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tripDescription, setTripDescription] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<SearchCategory>>(new Set(['flights']));

  // State for the view
  const [currentView, setCurrentView] = useState<'form' | 'chat' | 'plan'>('form');
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');
    if (chatIdFromUrl) {
      // This logic can be adapted if we still want to link to old chats
      // For now, starting fresh is the main flow.
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSearchTypeToggle = (category: SearchCategory) => {
    setSelectedCategories(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(category)) {
        if (newSelection.size > 1) {
          newSelection.delete(category);
        }
      } else {
        newSelection.add(category);
      }
      return newSelection;
    });
  };

  const placeholders: { [key: string]: string } = {
    'flights': "'Un vuelo a Bali para 2 personas en diciembre'",
    'hotels': "'Hoteles de 5 estrellas en Roma con piscina'",
    'experiences': "'Ruta del vino en la Toscana'",
    'flights,hotels': "'Vuelo y hotel para una escapada a París el próximo fin de semana'",
    'flights,experiences': "'Vuelos a Costa Rica y un tour por la selva para ver perezosos'",
    'hotels,experiences': "'Hotel boutique en Kioto y una clase de ceremonia del té'",
    'flights,hotels,experiences': "'Un viaje completo a Japón para 3 personas en verano'",
  };

  const placeholderKey = useMemo(() => {
    const sortedCategories = Array.from(selectedCategories).sort().join(',');
    return placeholders[sortedCategories] || placeholders['flights,hotels,experiences'];
  }, [selectedCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDescription) return;
    setIsStartingChat(true);
    setCurrentView('chat');
  };

  const handleChatComplete = async (brief: { initialQuery: string; chatHistory: any[] }) => {
    setCurrentView('plan');
    try {
      const plan = await generatePlan(brief, null); // userLocation is null for now
      setTravelPlan(plan);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while generating the plan.";
      setPlanError(errorMessage);
    }
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

  if (currentView === 'chat') {
    return (
      <div className="py-8 md:py-12 min-h-screen bg-gray-50/50">
        <ChatView
          onChatComplete={handleChatComplete}
          error={null}
          initialQuery={tripDescription}
          selectedCategories={selectedCategories}
        />
      </div>
    );
  }

  if (currentView === 'plan') {
    if (planError) {
      return <div className="text-center py-10"><h2 className="text-destructive">Error generating plan</h2><p>{planError}</p></div>;
    }
    if (!travelPlan) {
      return <div className="flex min-h-screen items-center justify-center"><Loader /> <p className="ml-4">Generating your travel plan...</p></div>;
    }
    // A simple display for the travel plan. This can be expanded into its own component.
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Your Travel Plan to {travelPlan.summary.destination}</h1>
        <pre className="mt-4 p-4 bg-muted rounded-lg whitespace-pre-wrap">{JSON.stringify(travelPlan, null, 2)}</pre>
      </div>
    )
  }

  // Initial Form View
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
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <AnimatePresence mode="wait">
              <motion.div
                key={placeholderKey}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Input
                  type="text"
                  value={tripDescription}
                  onChange={(e) => setTripDescription(e.target.value)}
                  placeholder={placeholderKey}
                  className="relative h-14 pl-12 pr-4 text-base rounded-full shadow-lg bg-card border-transparent focus:ring-2 focus:ring-ring transition-transform duration-300 ease-in-out hover:scale-[1.02] placeholder:text-muted-foreground"
                  autoFocus
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 px-10 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-transform duration-300 ease-in-out disabled:scale-100 enabled:hover:scale-105"
            disabled={isStartingChat || !tripDescription}
          >
            {isStartingChat ? <Loader /> : 'Enviar'}
          </Button>
        </form>
      </div>
    </div>
  );
}


export default function PlanPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader /></div>}>
      <PlanPageComponent />
    </Suspense>
  )
}
