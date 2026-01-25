'use client';

import { useUser } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { BackgroundCarousel } from '@/components/ui/background-carousel';
import ChatView from '@/components/chat/chat-view';
import { TravelPlan, TravelBrief } from '@/types';
import { generatePlan } from '@/app/actions/chat-actions';
import { processAndSendData } from '@/app/actions';
import { getUserIdFromCookie, getChatIdFromCookie, saveChatIdToCookie } from '@/lib/cookies';
import { ApiService } from '@/services/api';
import Link from 'next/link';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

type SearchCategory = 'flights' | 'hotels' | 'experiences';

// Flight options type for the new toggles
export interface FlightOptions {
  luggageType: 'hand_only' | 'hand_and_hold' | null;
  directFlightsOnly: boolean;
  budgetClass: 'economy' | 'first_class' | null;
  departureDate: string | null;
  returnDate: string | null;
  oneWayOnly: boolean;
}

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

  // New flight options state for toggles
  const [flightOptions, setFlightOptions] = useState<FlightOptions>({
    luggageType: null,
    directFlightsOnly: false,
    budgetClass: null,
    departureDate: null,
    returnDate: null,
    oneWayOnly: false,
  });

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
      // Pass flight options only if flights category is selected and some options are set
      const hasFlightOptions = categories.includes('flights') && (
        flightOptions.luggageType !== null ||
        flightOptions.directFlightsOnly ||
        flightOptions.budgetClass !== null ||
        flightOptions.departureDate !== null ||
        flightOptions.oneWayOnly
      );
      const chatResponse = await ApiService.startChat(
        userId,
        categories,
        hasFlightOptions ? flightOptions : undefined
      );

      if (!chatResponse || !chatResponse.chatId) {
        alert('Error al crear el chat: respuesta inválida del servidor');
        setIsCreatingChat(false);
        return;
      }

      saveChatIdToCookie(chatResponse.chatId);
      // Redirigir a la ruta del chat con el mensaje inicial como parámetro
      router.push(`/chats/${chatResponse.chatId}?initialQuery=${encodeURIComponent(tripDescription)}`);
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
          <BackgroundCarousel
            images={[
              "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop", // Switzerland/Mountain
              "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=2574&auto=format&fit=crop", // Tropical Beach
              "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto=format&fit=crop", // NYC City
              "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop", // Lake/Nature
              "https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2092&auto=format&fit=crop", // Japan Night
            ]}
            overlayGradient="linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(15, 23, 42, 0.9) 100%)"
            className=""
          />
          {/* Subtle gradient at the bottom to blend with content */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-light dark:to-background z-10 pointer-events-none" />
        </div>

        <div className="relative z-20 flex flex-col items-center max-w-[800px] w-full text-center gap-6 md:gap-8">
          {/* Text Content */}
          <div className="flex flex-col gap-4">
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
              Diseña tu próxima{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-white">
                aventura con IA
              </span>
            </h1>
            <p className="text-slate-100 text-base md:text-lg font-normal leading-relaxed max-w-2xl mx-auto drop-shadow-md">
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
          <form onSubmit={handleSubmit} className="w-full max-w-[700px] flex flex-col gap-4">
            <label className="group relative flex flex-col min-h-[64px] md:min-h-[72px] w-full shadow-2xl shadow-voaya-primary/10 rounded-2xl transition-all duration-300 focus-within:shadow-voaya-primary/30 focus-within:-translate-y-1">
              <div className="flex w-full flex-1 items-center rounded-2xl bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark group-focus-within:border-voaya-primary overflow-hidden">
                <div className="text-voaya-primary flex items-center justify-center pl-5 pr-3">
                  <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                </div>
                <input
                  value={tripDescription}
                  onChange={(e) => setTripDescription(e.target.value)}
                  aria-label="Describe your trip"
                  className="flex w-full min-w-0 flex-1 bg-transparent border-none focus:ring-0 text-text-main dark:text-white placeholder:text-text-muted text-base md:text-lg outline-none"
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

            {/* Flight Options Toggles - Only shown when flights category is selected */}
            {selectedCategories.has('flights') && (
              <div className="flex flex-col gap-4 pt-4 w-full max-w-[700px]">
                {/* Row 1: Luggage and Direct Flights */}
                <div className="flex flex-wrap justify-center gap-3">
                  {/* Luggage Type */}
                  <div className="flex items-center gap-2 bg-white dark:bg-surface-dark rounded-xl border border-stroke dark:border-input-dark p-2">
                    <span className="material-symbols-outlined text-voaya-primary text-[18px]">luggage</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setFlightOptions(prev => ({ ...prev, luggageType: prev.luggageType === 'hand_only' ? null : 'hand_only' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${flightOptions.luggageType === 'hand_only'
                          ? 'bg-voaya-primary text-white'
                          : 'bg-slate-100 dark:bg-input-dark text-text-secondary dark:text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        Solo mano
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlightOptions(prev => ({ ...prev, luggageType: prev.luggageType === 'hand_and_hold' ? null : 'hand_and_hold' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${flightOptions.luggageType === 'hand_and_hold'
                          ? 'bg-voaya-primary text-white'
                          : 'bg-slate-100 dark:bg-input-dark text-text-secondary dark:text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        + Bodega
                      </button>
                    </div>
                  </div>

                  {/* Direct Flights Toggle */}
                  <button
                    type="button"
                    onClick={() => setFlightOptions(prev => ({ ...prev, directFlightsOnly: !prev.directFlightsOnly }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${flightOptions.directFlightsOnly
                      ? 'bg-voaya-primary text-white border-voaya-primary'
                      : 'bg-white dark:bg-surface-dark border-stroke dark:border-input-dark text-text-secondary dark:text-text-muted hover:border-voaya-primary'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                    <span className="text-xs font-medium">Solo directos</span>
                  </button>

                  {/* Budget Class */}
                  <div className="flex items-center gap-2 bg-white dark:bg-surface-dark rounded-xl border border-stroke dark:border-input-dark p-2">
                    <span className="material-symbols-outlined text-amber-500 text-[18px]">payments</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setFlightOptions(prev => ({ ...prev, budgetClass: prev.budgetClass === 'economy' ? null : 'economy' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${flightOptions.budgetClass === 'economy'
                          ? 'bg-voaya-primary text-white'
                          : 'bg-slate-100 dark:bg-input-dark text-text-secondary dark:text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        Económico
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlightOptions(prev => ({ ...prev, budgetClass: prev.budgetClass === 'first_class' ? null : 'first_class' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${flightOptions.budgetClass === 'first_class'
                          ? 'bg-voaya-primary text-white'
                          : 'bg-slate-100 dark:bg-input-dark text-text-secondary dark:text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        Business
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Dates */}
                <div className="flex flex-wrap justify-center items-center gap-3">
                  {/* Departure Date */}
                  <div className="flex items-center gap-2 bg-white dark:bg-surface-dark rounded-xl border border-stroke dark:border-input-dark p-1 pr-2">
                    <span className="material-symbols-outlined text-voaya-primary text-[18px] ml-2">flight_takeoff</span>
                    <DatePicker
                      date={flightOptions.departureDate ? new Date(flightOptions.departureDate) : undefined}
                      setDate={(date) => setFlightOptions(prev => ({ ...prev, departureDate: date ? format(date, 'yyyy-MM-dd') : null }))}
                      placeholder="Fecha ida"
                      className="border-0 bg-transparent shadow-none hover:bg-transparent h-9 px-2 text-xs font-medium text-text-main dark:text-white w-[150px] justify-start"
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </div>

                  {/* One Way Toggle */}
                  <button
                    type="button"
                    onClick={() => setFlightOptions(prev => ({
                      ...prev,
                      oneWayOnly: !prev.oneWayOnly,
                      returnDate: !prev.oneWayOnly ? null : prev.returnDate
                    }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${flightOptions.oneWayOnly
                      ? 'bg-voaya-primary text-white border-voaya-primary'
                      : 'bg-white dark:bg-surface-dark border-stroke dark:border-input-dark text-text-secondary dark:text-text-muted hover:border-voaya-primary'
                      }`}
                  >
                    <span className="text-xs font-medium">Solo ida</span>
                  </button>

                  {/* Return Date - Hidden when oneWayOnly */}
                  {!flightOptions.oneWayOnly && (
                    <div className="flex items-center gap-2 bg-white dark:bg-surface-dark rounded-xl border border-stroke dark:border-input-dark p-1 pr-2">
                      <span className="material-symbols-outlined text-emerald-500 text-[18px] ml-2">flight_land</span>
                      <DatePicker
                        date={flightOptions.returnDate ? new Date(flightOptions.returnDate) : undefined}
                        setDate={(date) => setFlightOptions(prev => ({ ...prev, returnDate: date ? format(date, 'yyyy-MM-dd') : null }))}
                        placeholder="Fecha vuelta"
                        className="border-0 bg-transparent shadow-none hover:bg-transparent h-9 px-2 text-xs font-medium text-text-main dark:text-white w-[150px] justify-start"
                        disabled={(date) => {
                          const today = new Date(new Date().setHours(0, 0, 0, 0));
                          const depDate = flightOptions.departureDate ? new Date(flightOptions.departureDate) : today;
                          return date < depDate;
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Info text */}
                <p className="text-center text-text-muted text-xs">
                  Estos filtros son opcionales. También puedes describir todo en el chat.
                </p>
              </div>
            )}
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
