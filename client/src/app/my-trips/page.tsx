'use client';

import { useUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';

type TabType = 'upcoming' | 'drafts' | 'past';

// Mock trip cards for visual display - these would come from backend in production
const mockTrips = {
  upcoming: [
    {
      id: '1',
      destination: 'Kyoto, Japón',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
      dates: '12 Oct - 20 Oct',
      daysUntil: 12,
      status: 'confirmed' as const,
    },
    {
      id: '2',
      destination: 'Tulum, México',
      image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80',
      dates: '05 Dic - 10 Dic',
      status: 'refining' as const,
    },
  ],
  past: [
    {
      id: '3',
      destination: 'París, Francia',
      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
      dates: '10 Mar - 15 Mar, 2023',
    },
    {
      id: '4',
      destination: 'Barcelona, España',
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
      dates: '05 Ene - 12 Ene, 2023',
    },
  ],
};

export default function MyTripsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    // Timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setForceReady(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading && !forceReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user && !forceReady) {
    return null;
  }

  return (
    <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 lg:px-8 bg-background-light dark:bg-background">
      <div className="flex flex-col max-w-[1024px] w-full gap-8">
        {/* Page Heading & AI Prompt */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-text-main dark:text-white">
              Mis Viajes
            </h1>
            <p className="text-text-secondary dark:text-text-muted text-base font-medium">
              Gestiona tus itinerarios creados con IA y tus aventuras pasadas.
            </p>
          </div>

          {/* Quick AI Action */}
          <div className="w-full md:w-auto md:min-w-[400px]">
            <div className="relative group shadow-soft rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-voaya-primary">auto_awesome</span>
              </div>
              <input
                className="block w-full pl-12 pr-14 py-3.5 border border-stroke dark:border-input-dark rounded-xl bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder-text-muted focus:ring-2 focus:ring-voaya-primary focus:border-transparent transition-shadow outline-none font-medium"
                placeholder="¿A dónde quieres ir ahora?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <div className="bg-blue-50 dark:bg-voaya-primary/20 hover:bg-blue-100 dark:hover:bg-voaya-primary/30 p-2 rounded-lg text-voaya-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-stroke dark:border-input-dark">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`relative flex flex-col items-center justify-center pb-3 pt-2 border-b-[3px] transition-colors ${activeTab === 'upcoming'
                ? 'text-voaya-primary border-voaya-primary'
                : 'text-text-secondary dark:text-text-muted hover:text-text-main dark:hover:text-white border-transparent'
                }`}
            >
              <p className="text-sm font-bold tracking-[0.015em]">Programados</p>
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`relative flex flex-col items-center justify-center pb-3 pt-2 border-b-[3px] transition-colors group ${activeTab === 'drafts'
                ? 'text-voaya-primary border-voaya-primary'
                : 'text-text-secondary dark:text-text-muted hover:text-text-main dark:hover:text-white border-transparent'
                }`}
            >
              <p className="text-sm font-bold tracking-[0.015em]">Borradores</p>
              <span className="absolute top-0 -right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-voaya-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-voaya-primary"></span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`relative flex flex-col items-center justify-center pb-3 pt-2 border-b-[3px] transition-colors ${activeTab === 'past'
                ? 'text-voaya-primary border-voaya-primary'
                : 'text-text-secondary dark:text-text-muted hover:text-text-main dark:hover:text-white border-transparent'
                }`}
            >
              <p className="text-sm font-bold tracking-[0.015em]">Pasados</p>
            </button>
          </div>
        </div>

        {/* Active Trips Grid */}
        {activeTab === 'upcoming' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockTrips.upcoming.map((trip) => (
              <article
                key={trip.id}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Status Badge */}
                <div className="absolute top-4 left-4 z-20">
                  {trip.status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
                      <span className="size-1.5 rounded-full bg-white"></span>
                      Confirmado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-voaya-primary/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
                      <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                      IA Refinando...
                    </span>
                  )}
                </div>

                {/* More Button */}
                <div className="absolute top-4 right-4 z-20">
                  <button className="size-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md transition-colors border border-white/20">
                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                  </button>
                </div>

                {/* Image */}
                <div
                  className="h-[280px] w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%), url("${trip.image}")`
                  }}
                />

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-md">{trip.destination}</h3>
                      <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        <span>{trip.dates}</span>
                        {trip.daysUntil && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/60"></span>
                            <span className="text-blue-200 font-bold bg-blue-900/30 px-2 py-0.5 rounded-md backdrop-blur-sm">
                              En {trip.daysUntil} días
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {trip.status === 'confirmed' ? (
                    <button className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-bold text-voaya-primary hover:bg-blue-50 transition-colors shadow-sm">
                      <span>Ver Itinerario</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  ) : (
                    <div className="flex gap-3 mt-2">
                      <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white/20 backdrop-blur-md py-3 text-sm font-bold text-white hover:bg-white/30 transition-colors border border-white/20">
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                        <span>Preferencias</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-voaya-primary py-3 text-sm font-bold text-white hover:bg-voaya-primary-dark transition-colors shadow-sm">
                        <span>Ver Estado</span>
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Drafts Tab */}
        {activeTab === 'drafts' && (
          <div className="text-center py-16 text-text-secondary dark:text-text-muted">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">edit_note</span>
            <p className="text-lg font-medium">No tienes borradores pendientes</p>
            <p className="mt-2">Los viajes que dejes sin terminar aparecerán aquí</p>
          </div>
        )}

        {/* Past Trips Section */}
        {activeTab === 'past' && (
          <section className="flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-main dark:text-white">Historial Reciente</h2>
              <button className="text-sm font-bold text-voaya-primary hover:text-voaya-primary-dark transition-colors">
                Ver todos
              </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-stroke dark:border-input-dark shadow-sm divide-y divide-stroke dark:divide-input-dark">
              {mockTrips.past.map((trip, index) => (
                <div
                  key={trip.id}
                  className={`p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-input-dark transition-colors cursor-pointer group ${index === 0 ? 'rounded-t-2xl' : ''
                    } ${index === mockTrips.past.length - 1 ? 'rounded-b-2xl' : ''}`}
                >
                  <div
                    className="h-16 w-20 rounded-lg bg-cover bg-center shrink-0 shadow-sm"
                    style={{ backgroundImage: `url("${trip.image}")` }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-text-main dark:text-white truncate">
                      {trip.destination}
                    </h4>
                    <p className="text-sm text-text-secondary dark:text-text-muted font-medium">
                      {trip.dates}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-2.5 py-1 text-xs font-bold text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                      Completado
                    </span>
                  </div>
                  <button className="p-2 text-text-muted group-hover:text-voaya-primary transition-all group-hover:translate-x-1">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Show Recent History on upcoming tab too */}
        {activeTab === 'upcoming' && (
          <section className="flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-main dark:text-white">Historial Reciente</h2>
              <button className="text-sm font-bold text-voaya-primary hover:text-voaya-primary-dark transition-colors">
                Ver todos
              </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-stroke dark:border-input-dark shadow-sm divide-y divide-stroke dark:divide-input-dark">
              {mockTrips.past.slice(0, 2).map((trip, index) => (
                <div
                  key={trip.id}
                  className={`p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-input-dark transition-colors cursor-pointer group ${index === 0 ? 'rounded-t-2xl' : 'rounded-b-2xl'
                    }`}
                >
                  <div
                    className="h-16 w-20 rounded-lg bg-cover bg-center shrink-0 shadow-sm"
                    style={{ backgroundImage: `url("${trip.image}")` }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-text-main dark:text-white truncate">
                      {trip.destination}
                    </h4>
                    <p className="text-sm text-text-secondary dark:text-text-muted font-medium">
                      {trip.dates}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-2.5 py-1 text-xs font-bold text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                      Completado
                    </span>
                  </div>
                  <button className="p-2 text-text-muted group-hover:text-voaya-primary transition-all group-hover:translate-x-1">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Floating AI Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <Link href="/plan">
          <button className="flex items-center justify-center size-14 rounded-full bg-voaya-primary text-white shadow-lg shadow-voaya-primary/40 hover:scale-105 transition-transform active:scale-95">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          </button>
        </Link>
      </div>
    </main>
  );
}
