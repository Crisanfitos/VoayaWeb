'use client';

import { useUser } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import ChatView from '@/components/chat/chat-view';
import { TravelPlan, TravelBrief } from '@/types';
import { generatePlan } from '@/app/actions/chat-actions';
import { processAndSendData } from '@/app/actions';
import { getUserIdFromCookie, getChatIdFromCookie, saveChatIdToCookie } from '@/lib/cookies';
import { ApiService } from '@/services/api';
import Link from 'next/link';

type SearchCategory = 'flights' | 'hotels' | 'experiences';

// Trending destinations for visual display
const trendingDestinations = [
  {
    id: '1',
    name: 'Kyoto, Japón',
    category: 'Cultura y Templos',
    rating: 9.8,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  },
  {
    id: '2',
    name: 'Santorini, Grecia',
    category: 'Romántico y Playa',
    rating: 9.6,
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&q=80',
  },
  {
    id: '3',
    name: 'Cusco, Perú',
    category: 'Historia y Aventura',
    rating: 9.5,
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&q=80',
  },
  {
    id: '4',
    name: 'Nueva York, USA',
    category: 'Urbano y Moderno',
    rating: 9.2,
    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
  },
];

function PlanPageComponent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tripDescription, setTripDescription] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<SearchCategory>>(new Set(['flights'] as SearchCategory[]));
  const [isSendingToWebhook, setIsSendingToWebhook] = useState(false);

  const [currentView, setCurrentView] = useState<'form' | 'chat' | 'plan'>('form');
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    const chatIdFromUrl = searchParams?.get('chatId');
    if (chatIdFromUrl) {
      // Logic for old chat links
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
    'flights': "Un vuelo a Bali para 2 personas en diciembre",
    'hotels': "Hoteles de 5 estrellas en Roma con piscina",
    'experiences': "Ruta del vino en la Toscana",
    'flights,hotels': "Vuelo y hotel para una escapada a París",
    'flights,experiences': "Vuelos a Costa Rica y tour por la selva",
    'hotels,experiences': "Hotel boutique en Kioto y ceremonia del té",
    'flights,hotels,experiences': "Viaje completo a Japón para 3 personas",
  };

  const placeholderKey = useMemo(() => {
    const sortedCategories = Array.from(selectedCategories).sort().join(',');
    return placeholders[sortedCategories] || placeholders['flights,hotels,experiences'];
  }, [selectedCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDescription) return;

    setIsCreatingChat(true);

    try {
      const userId = getUserIdFromCookie();
      if (!userId) {
        alert('Por favor, inicia sesión primero');
        setIsCreatingChat(false);
        return;
      }

      const categories = Array.from(selectedCategories);
      const chatResponse = await ApiService.startChat(userId, categories);

      if (!chatResponse || !chatResponse.chatId) {
        alert('Error al crear el chat: respuesta inválida del servidor');
        setIsCreatingChat(false);
        return;
      }

      saveChatIdToCookie(chatResponse.chatId);
      setCurrentView('chat');
    } catch (error) {
      console.error('Failed to create chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al crear el chat: ${errorMessage}`);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleChatComplete = async (brief: TravelBrief) => {
    if (selectedCategories.size === 1 && selectedCategories.has('flights')) {
      setIsSendingToWebhook(true);
      setPlanError(null);

      const result = await processAndSendData(brief.chatHistory, 'flights');

      if (result.success) {
        alert(result.message);
        setTripDescription('');
        setCurrentView('form');
      } else {
        setPlanError(result.message);
      }
      setIsSendingToWebhook(false);
      return;
    }

    setCurrentView('plan');
    try {
      const plan = await generatePlan(brief, null);
      setTravelPlan(plan);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while generating the plan.";
      setPlanError(errorMessage);
    }
  };

  if (isUserLoading || isSendingToWebhook || isCreatingChat) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background">
        <Loader />
        {isSendingToWebhook && <p className="ml-4 text-text-secondary">Enviando tu solicitud de vuelo...</p>}
        {isCreatingChat && <p className="ml-4 text-text-secondary">Creando tu chat...</p>}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (currentView === 'chat') {
    return (
      <div className="py-8 md:py-12 min-h-screen bg-background-light dark:bg-background">
        <ChatView
          onChatComplete={handleChatComplete}
          error={null}
          initialQuery={tripDescription}
          selectedCategories={selectedCategories}
          userId={user.id}
          chatId={getChatIdFromCookie() || undefined}
        />
      </div>
    );
  }

  if (currentView === 'plan') {
    if (planError) {
      return (
        <div className="text-center py-10 bg-background-light dark:bg-background min-h-screen">
          <h2 className="text-destructive text-xl font-bold">Error generating plan</h2>
          <p className="text-text-secondary mt-2">{planError}</p>
        </div>
      );
    }
    if (!travelPlan) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background">
          <Loader />
          <p className="ml-4 text-text-secondary">Generating your travel plan...</p>
        </div>
      );
    }
    return (
      <div className="container mx-auto px-4 py-8 bg-background-light dark:bg-background min-h-screen">
        <h1 className="text-3xl font-bold text-text-main dark:text-white">
          Your Travel Plan to {travelPlan.summary.destination}
        </h1>
        <pre className="mt-4 p-4 bg-white dark:bg-surface-dark rounded-lg whitespace-pre-wrap text-sm">
          {JSON.stringify(travelPlan, null, 2)}
        </pre>
      </div>
    );
  }

  const searchOptions = [
    { id: 'flights' as const, label: 'Vuelos', icon: 'flight' },
    { id: 'hotels' as const, label: 'Hoteles', icon: 'hotel' },
    { id: 'experiences' as const, label: 'Experiencias', icon: 'landscape' },
  ];

  return (
    <main className="flex-grow bg-background-light dark:bg-background">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-16 md:py-24 lg:py-32 overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background-light/90 dark:from-background-dark/90 via-background-light/80 dark:via-background-dark/80 to-background-light dark:to-background-dark z-10" />
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop")`
            }}
          />
        </div>

        <div className="relative z-20 flex flex-col items-center max-w-[800px] w-full text-center gap-6 md:gap-8">
          {/* Text Content */}
          <div className="flex flex-col gap-4">
            <h1 className="text-text-main dark:text-white text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em]">
              Diseña tu próxima{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-voaya-primary to-blue-400">
                aventura con IA
              </span>
            </h1>
            <p className="text-text-secondary dark:text-text-muted text-base md:text-lg font-normal leading-relaxed max-w-2xl mx-auto">
              Cuéntanos qué buscas y crearemos el itinerario perfecto para ti en segundos.
            </p>
          </div>

          {/* Category Buttons */}
          <div className="flex justify-center gap-3 flex-wrap">
            {searchOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSearchTypeToggle(option.id)}
                className={`flex items-center gap-2 h-10 px-5 rounded-xl font-bold text-sm transition-all ${selectedCategories.has(option.id)
                    ? 'bg-voaya-primary text-white shadow-lg shadow-voaya-primary/20'
                    : 'bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark text-text-secondary dark:text-text-muted hover:border-voaya-primary hover:text-voaya-primary'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>

          {/* Input Module */}
          <form onSubmit={handleSubmit} className="w-full max-w-[600px] flex flex-col gap-4">
            <label className="group relative flex flex-col min-h-[64px] md:min-h-[72px] w-full shadow-2xl shadow-voaya-primary/10 rounded-2xl transition-all duration-300 focus-within:shadow-voaya-primary/30 focus-within:-translate-y-1">
              <div className="flex w-full flex-1 items-stretch rounded-2xl bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark group-focus-within:border-voaya-primary overflow-hidden">
                <div className="text-voaya-primary flex items-center justify-center pl-5 pr-3">
                  <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                </div>
                <input
                  value={tripDescription}
                  onChange={(e) => setTripDescription(e.target.value)}
                  aria-label="Describe your trip"
                  className="flex w-full min-w-0 flex-1 bg-transparent border-none focus:ring-0 text-text-main dark:text-white placeholder:text-text-muted text-base md:text-lg h-full py-4 outline-none"
                  placeholder={placeholderKey}
                  type="text"
                />
                <div className="flex items-center gap-2 pr-3 pl-2">
                  <button
                    type="button"
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-input-dark text-text-muted hover:text-voaya-primary transition-colors"
                    title="Use Voice"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button
                    type="submit"
                    disabled={!tripDescription || isCreatingChat}
                    className="hidden md:flex min-w-[120px] cursor-pointer items-center justify-center rounded-xl h-10 px-5 bg-voaya-primary text-white text-sm font-bold hover:bg-voaya-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Planificar
                  </button>
                </div>
              </div>
            </label>

            <Button
              type="submit"
              disabled={!tripDescription || isCreatingChat}
              className="md:hidden w-full h-12 rounded-xl bg-voaya-primary text-white font-bold text-base shadow-lg hover:bg-voaya-primary-dark transition-colors disabled:opacity-50"
            >
              {isCreatingChat ? <Loader /> : 'Planificar mi viaje'}
            </Button>

            {/* Suggested Chips */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTripDescription('Escapada romántica a París')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark hover:border-voaya-primary hover:bg-slate-50 dark:hover:bg-input-dark transition-all group"
              >
                <span className="material-symbols-outlined text-rose-500 text-[18px]">favorite</span>
                <span className="text-text-secondary dark:text-text-muted text-sm font-medium">Escapada romántica</span>
              </button>
              <button
                type="button"
                onClick={() => setTripDescription('Aventura en la naturaleza')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark hover:border-voaya-primary hover:bg-slate-50 dark:hover:bg-input-dark transition-all group"
              >
                <span className="material-symbols-outlined text-emerald-500 text-[18px]">landscape</span>
                <span className="text-text-secondary dark:text-text-muted text-sm font-medium">Aventura natural</span>
              </button>
              <button
                type="button"
                onClick={() => setTripDescription('Ruta gastronómica por España')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark hover:border-voaya-primary hover:bg-slate-50 dark:hover:bg-input-dark transition-all group"
              >
                <span className="material-symbols-outlined text-amber-500 text-[18px]">restaurant</span>
                <span className="text-text-secondary dark:text-text-muted text-sm font-medium">Ruta gastronómica</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-6 lg:px-20 border-y border-stroke dark:border-input-dark bg-white/50 dark:bg-surface-dark/50">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col gap-3 p-4 rounded-2xl hover:bg-white dark:hover:bg-surface-dark transition-colors duration-300">
            <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-voaya-primary flex items-center justify-center mb-2 mx-auto md:mx-0">
              <span className="material-symbols-outlined text-[28px]">chat</span>
            </div>
            <h3 className="text-text-main dark:text-white text-lg font-bold">1. Cuéntalo todo</h3>
            <p className="text-text-secondary dark:text-text-muted text-sm leading-relaxed">
              Describe tu viaje ideal usando lenguaje natural. Cuantos más detalles, mejor.
            </p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-2xl hover:bg-white dark:hover:bg-surface-dark transition-colors duration-300">
            <div className="size-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center mb-2 mx-auto md:mx-0">
              <span className="material-symbols-outlined text-[28px]">auto_fix_high</span>
            </div>
            <h3 className="text-text-main dark:text-white text-lg font-bold">2. Magia IA</h3>
            <p className="text-text-secondary dark:text-text-muted text-sm leading-relaxed">
              Nuestra IA analiza miles de opciones para crear un itinerario único y personalizado.
            </p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-2xl hover:bg-white dark:hover:bg-surface-dark transition-colors duration-300">
            <div className="size-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-500 flex items-center justify-center mb-2 mx-auto md:mx-0">
              <span className="material-symbols-outlined text-[28px]">flight_takeoff</span>
            </div>
            <h3 className="text-text-main dark:text-white text-lg font-bold">3. ¡A viajar!</h3>
            <p className="text-text-secondary dark:text-text-muted text-sm leading-relaxed">
              Reserva vuelos y hoteles directamente, o ajusta el plan hasta que sea perfecto.
            </p>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-12 lg:py-16 px-6 lg:px-20 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-text-main dark:text-white text-2xl md:text-3xl font-bold tracking-tight">
            Destinos en Tendencia
          </h2>
          <Link href="#" className="text-voaya-primary text-sm font-semibold hover:underline flex items-center gap-1">
            Ver todo <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingDestinations.map((dest) => (
            <button
              key={dest.id}
              onClick={() => setTripDescription(`Viaje a ${dest.name}`)}
              className="group relative flex flex-col gap-3 rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-2 text-left"
            >
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <div className="absolute top-3 right-3 z-20 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                  <span className="material-symbols-outlined text-yellow-400 text-[14px] fill">star</span>
                  <span className="text-white text-xs font-bold">{dest.rating}</span>
                </div>
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url("${dest.image}")` }}
                />
                <div className="absolute bottom-4 left-4 z-20">
                  <h3 className="text-white text-xl font-bold">{dest.name}</h3>
                  <p className="text-slate-300 text-sm">{dest.category}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background"><Loader /></div>}>
      <PlanPageComponent />
    </Suspense>
  );
}
