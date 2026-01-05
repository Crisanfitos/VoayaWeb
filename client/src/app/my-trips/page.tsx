'use client';

import { useUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';
import { ApiService } from '@/services/api';
import { getUserIdFromCookie } from '@/lib/cookies';

type TabType = 'programados' | 'borradores' | 'pasados';

// Tipo para viajes desde la API
interface Viaje {
  id: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'borrador' | 'planificando' | 'confirmado' | 'completado' | 'cancelado';
  imagenUrl?: string;
  vuelos: any[];
  hoteles: any[];
}

// Imágenes placeholder por defecto
const IMAGENES_PLACEHOLDER = [
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80', // Kyoto
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80', // Beach
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', // Paris
  'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80', // Barcelona
];

function obtenerImagenPlaceholder(index: number): string {
  return IMAGENES_PLACEHOLDER[index % IMAGENES_PLACEHOLDER.length];
}

function formatearFechas(fechaInicio: string, fechaFin: string): string {
  if (!fechaInicio || !fechaFin) return 'Fechas sin definir';

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const diaInicio = inicio.getDate();
  const mesInicio = meses[inicio.getMonth()];
  const diaFin = fin.getDate();
  const mesFin = meses[fin.getMonth()];
  const anioFin = fin.getFullYear();

  if (mesInicio === mesFin) {
    return `${diaInicio} - ${diaFin} ${mesFin}`;
  }
  return `${diaInicio} ${mesInicio} - ${diaFin} ${mesFin}, ${anioFin}`;
}

function calcularDiasHasta(fechaInicio: string): number | null {
  if (!fechaInicio) return null;
  const ahora = new Date();
  const inicio = new Date(fechaInicio);
  const diff = Math.ceil((inicio.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export default function MyTripsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('programados');
  const [searchQuery, setSearchQuery] = useState('');
  const [forceReady, setForceReady] = useState(false);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Shorter timeout to prevent long waits
    const timer = setTimeout(() => {
      setForceReady(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Cargar viajes cuando cambia el tab o el usuario
  useEffect(() => {
    const cargarViajes = async () => {
      const userId = getUserIdFromCookie() || user?.id;
      if (!userId) {
        setViajes([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await ApiService.obtenerViajes(userId, activeTab);
        setViajes(response.viajes || []);
      } catch (err: any) {
        console.error('Error cargando viajes:', err);
        // Solo mostrar error si no es un 404 o similar
        if (err?.message?.includes('404')) {
          setViajes([]);
        } else {
          setError(err?.message || 'Error al cargar viajes');
          setViajes([]);
        }
      } finally {
        setLoading(false);
      }
    };

    // Cargar viajes si hay usuario O si forceReady y hay userId en cookie
    const userId = getUserIdFromCookie();
    if (user || (forceReady && userId)) {
      cargarViajes();
    }
  }, [user, activeTab, forceReady]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/plan?q=${encodeURIComponent(searchQuery)}`);
    }
  };

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
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
              <button
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
                onClick={handleSearchSubmit}
              >
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
              onClick={() => setActiveTab('programados')}
              className={`relative flex flex-col items-center justify-center pb-3 pt-2 border-b-[3px] transition-colors ${activeTab === 'programados'
                ? 'text-voaya-primary border-voaya-primary'
                : 'text-text-secondary dark:text-text-muted hover:text-text-main dark:hover:text-white border-transparent'
                }`}
            >
              <p className="text-sm font-bold tracking-[0.015em]">Programados</p>
            </button>
            <button
              onClick={() => setActiveTab('borradores')}
              className={`relative flex flex-col items-center justify-center pb-3 pt-2 border-b-[3px] transition-colors group ${activeTab === 'borradores'
                ? 'text-voaya-primary border-voaya-primary'
                : 'text-text-secondary dark:text-text-muted hover:text-text-main dark:hover:text-white border-transparent'
                }`}
            >
              <p className="text-sm font-bold tracking-[0.015em]">Borradores</p>
            </button>
            <button
              onClick={() => setActiveTab('pasados')}
              className={`relative flex flex-col items-center justify-center pb-3 pt-2 border-b-[3px] transition-colors ${activeTab === 'pasados'
                ? 'text-voaya-primary border-voaya-primary'
                : 'text-text-secondary dark:text-text-muted hover:text-text-main dark:hover:text-white border-transparent'
                }`}
            >
              <p className="text-sm font-bold tracking-[0.015em]">Pasados</p>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16 text-red-500">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">error</span>
            <p className="text-lg font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && viajes.length === 0 && (
          <div className="text-center py-16 text-text-secondary dark:text-text-muted">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
              {activeTab === 'borradores' ? 'edit_note' : activeTab === 'pasados' ? 'history' : 'flight_takeoff'}
            </span>
            <p className="text-lg font-medium">
              {activeTab === 'programados' && 'No tienes viajes programados'}
              {activeTab === 'borradores' && 'No tienes borradores pendientes'}
              {activeTab === 'pasados' && 'No tienes viajes pasados'}
            </p>
            <p className="mt-2">
              {activeTab === 'programados' && 'Empieza a planificar tu próxima aventura con IA'}
              {activeTab === 'borradores' && 'Los viajes que dejes sin terminar aparecerán aquí'}
              {activeTab === 'pasados' && 'Tus viajes completados se mostrarán aquí'}
            </p>
            {activeTab === 'programados' && (
              <Link href="/plan">
                <button className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-voaya-primary text-white rounded-xl font-bold hover:bg-voaya-primary-dark transition-colors">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Planificar Viaje
                </button>
              </Link>
            )}
          </div>
        )}

        {/* Trips Grid - Programados */}
        {!loading && !error && viajes.length > 0 && activeTab === 'programados' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {viajes.map((viaje, index) => {
              const diasHasta = calcularDiasHasta(viaje.fechaInicio);
              const imagen = viaje.imagenUrl || obtenerImagenPlaceholder(index);

              return (
                <article
                  key={viaje.id}
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    {viaje.estado === 'confirmado' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
                        <span className="size-1.5 rounded-full bg-white"></span>
                        Confirmado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-voaya-primary/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                        {viaje.estado === 'planificando' ? 'IA Refinando...' : 'En proceso'}
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
                      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%), url("${imagen}")`
                    }}
                  />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col gap-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-md">{viaje.destino || 'Destino sin definir'}</h3>
                        <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                          <span>{formatearFechas(viaje.fechaInicio, viaje.fechaFin)}</span>
                          {diasHasta && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-white/60"></span>
                              <span className="text-blue-200 font-bold bg-blue-900/30 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                En {diasHasta} días
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {viaje.estado === 'confirmado' ? (
                      <Link href={`/viajes/${viaje.id}`}>
                        <button className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-bold text-voaya-primary hover:bg-blue-50 transition-colors shadow-sm">
                          <span>Ver Itinerario</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </Link>
                    ) : (
                      <div className="flex gap-3 mt-2">
                        <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white/20 backdrop-blur-md py-3 text-sm font-bold text-white hover:bg-white/30 transition-colors border border-white/20">
                          <span className="material-symbols-outlined text-[18px]">tune</span>
                          <span>Preferencias</span>
                        </button>
                        <Link href={`/viajes/${viaje.id}`} className="flex-1">
                          <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-voaya-primary py-3 text-sm font-bold text-white hover:bg-voaya-primary-dark transition-colors shadow-sm">
                            <span>Ver Estado</span>
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Trips List - Borradores y Pasados */}
        {!loading && !error && viajes.length > 0 && (activeTab === 'borradores' || activeTab === 'pasados') && (
          <section className="flex flex-col gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-stroke dark:border-input-dark shadow-sm divide-y divide-stroke dark:divide-input-dark">
              {viajes.map((viaje, index) => {
                const imagen = viaje.imagenUrl || obtenerImagenPlaceholder(index);

                return (
                  <Link key={viaje.id} href={`/viajes/${viaje.id}`}>
                    <div
                      className={`p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-input-dark transition-colors cursor-pointer group ${index === 0 ? 'rounded-t-2xl' : ''
                        } ${index === viajes.length - 1 ? 'rounded-b-2xl' : ''}`}
                    >
                      <div
                        className="h-16 w-20 rounded-lg bg-cover bg-center shrink-0 shadow-sm"
                        style={{ backgroundImage: `url("${imagen}")` }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-text-main dark:text-white truncate">
                          {viaje.destino || 'Destino sin definir'}
                        </h4>
                        <p className="text-sm text-text-secondary dark:text-text-muted font-medium">
                          {formatearFechas(viaje.fechaInicio, viaje.fechaFin)}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        {viaje.estado === 'completado' && (
                          <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-2.5 py-1 text-xs font-bold text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                            Completado
                          </span>
                        )}
                        {viaje.estado === 'borrador' && (
                          <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-900/20 px-2.5 py-1 text-xs font-bold text-gray-700 dark:text-gray-400 ring-1 ring-inset ring-gray-600/20">
                            Borrador
                          </span>
                        )}
                      </div>
                      <button className="p-2 text-text-muted group-hover:text-voaya-primary transition-all group-hover:translate-x-1">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </Link>
                );
              })}
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
