"use client";
import React, { useEffect, useState } from 'react';
import { getUserIdFromCookie, saveChatIdToCookie } from '@/lib/cookies';
import { ApiService } from '@/services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/auth';
import { Loader } from '@/components/ui/loader';

type ChatItem = {
  id: string;
  title?: string;
  status?: string;
  lastMessageAt?: any;
  metadata?: any;
};

type FilterType = 'all' | 'upcoming' | 'completed' | 'favorites';

const statusConfig: Record<string, { bg: string; text: string }> = {
  'En proceso': { bg: 'bg-voaya-primary', text: 'Planificación' },
  'Planificación': { bg: 'bg-voaya-primary', text: 'Planificación' },
  'Vuelos Listos': { bg: 'bg-green-500', text: 'Vuelos Listos' },
  'Borrador': { bg: 'bg-gray-500/80', text: 'Borrador' },
  'Completado': { bg: 'bg-purple-500', text: 'Completado' },
  'Finalizado': { bg: 'bg-purple-500', text: 'Completado' },
  'Favorito': { bg: 'bg-orange-500', text: 'Favorito' },
};

// Sample destinations for visual variety
const destinationImages = [
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', // Paris
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&q=80', // Beach
  'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80', // Japan
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', // Mountains
  'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80', // NYC
];

export default function ChatsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
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

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userId = getUserIdFromCookie() || undefined;
        const res: any = await ApiService.getChats(userId);
        setChats(res?.chats || []);
      } catch (err: any) {
        console.error('Failed to load chats', err);
        setError(err?.message || 'Error cargando chats');
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      load();
    }
  }, [user]);

  const handleChatClick = (chat: ChatItem) => {
    try {
      saveChatIdToCookie(chat.id);
    } catch (e) {
      console.error('Failed to save chatId cookie', e);
    }
    router.push(`/chats/${chat.id}`);
  };

  const filteredChats = chats.filter(chat => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return chat.title?.toLowerCase().includes(query) || chat.id.includes(query);
    }
    return true;
  });

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
    <main className="flex-1 w-full px-4 md:px-10 py-6 md:py-8 flex justify-center bg-background-light dark:bg-background">
      <div className="w-full max-w-[1200px] flex flex-col gap-8">
        {/* Heading & Welcome */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Mis Chats de Viaje
            </h1>
            <p className="text-text-secondary dark:text-text-muted text-base font-normal leading-relaxed">
              Hola{user?.email ? `, ${user.email.split('@')[0]}` : ''}. Aquí tienes tu historial de conversaciones. Retoma la planificación de tus próximas aventuras donde la dejaste.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-auto md:min-w-[320px]">
            <div className="relative flex items-center h-12 w-full rounded-xl bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark focus-within:ring-2 focus-within:ring-voaya-primary/20 focus-within:border-voaya-primary overflow-hidden shadow-sm transition-shadow">
              <div className="pl-4 pr-2 text-text-muted flex items-center justify-center">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="w-full bg-transparent border-none text-text-main dark:text-white placeholder:text-text-muted text-base font-normal focus:ring-0 h-full py-0 outline-none"
                placeholder="Buscar por destino o fecha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-5 transition-colors shadow-sm ${activeFilter === 'all'
              ? 'bg-text-main dark:bg-white text-white dark:text-text-main font-bold'
              : 'bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark hover:bg-gray-50 dark:hover:bg-input-dark text-text-secondary'
              }`}
          >
            <span className="text-sm font-medium">Todos</span>
          </button>
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-5 transition-colors shadow-sm ${activeFilter === 'upcoming'
              ? 'bg-text-main dark:bg-white text-white dark:text-text-main font-bold'
              : 'bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark hover:bg-gray-50 dark:hover:bg-input-dark text-text-secondary'
              }`}
          >
            <span className="text-sm font-medium">Próximos</span>
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-5 transition-colors shadow-sm ${activeFilter === 'completed'
              ? 'bg-text-main dark:bg-white text-white dark:text-text-main font-bold'
              : 'bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark hover:bg-gray-50 dark:hover:bg-input-dark text-text-secondary'
              }`}
          >
            <span className="text-sm font-medium">Completados</span>
          </button>
          <button
            onClick={() => setActiveFilter('favorites')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-5 transition-colors shadow-sm ${activeFilter === 'favorites'
              ? 'bg-text-main dark:bg-white text-white dark:text-text-main font-bold'
              : 'bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark hover:bg-gray-50 dark:hover:bg-input-dark text-text-secondary'
              }`}
          >
            <span className="text-sm font-medium">Favoritos</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Chat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* New Trip Card */}
          <Link href="/plan">
            <div className="group flex flex-col h-full min-h-[340px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-input-dark bg-white/50 dark:bg-transparent hover:bg-white dark:hover:bg-surface-dark hover:border-voaya-primary hover:shadow-lg hover:shadow-voaya-primary/5 transition-all cursor-pointer items-center justify-center gap-4 text-center p-6">
              <div className="size-16 rounded-full bg-voaya-primary/10 flex items-center justify-center text-voaya-primary group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-4xl">add_location_alt</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white">Nuevo Destino</h3>
                <p className="text-sm text-text-secondary dark:text-text-muted mt-1">Comienza una nueva conversación</p>
              </div>
            </div>
          </Link>

          {/* Chat Cards */}
          {loading && (
            <div className="col-span-full flex justify-center py-8">
              <Loader />
            </div>
          )}

          {!loading && filteredChats.length === 0 && (
            <div className="col-span-full text-text-secondary dark:text-text-muted text-center py-8">
              No tienes chats todavía. Inicia una conversación desde el planificador.
            </div>
          )}

          {filteredChats.map((chat, index) => {
            const status = statusConfig[chat.status || 'Finalizado'] || statusConfig['Finalizado'];
            const imageUrl = destinationImages[index % destinationImages.length];

            return (
              <button
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className="group relative flex flex-col bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm border border-stroke dark:border-input-dark hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:border-voaya-primary/30 transition-all duration-300 cursor-pointer h-full text-left"
              >
                {/* Image */}
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url("${imageUrl}")` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} text-white shadow-sm backdrop-blur-md border border-white/10`}>
                      {status.text}
                    </span>
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h3 className="text-white text-xl font-bold leading-tight mb-1">
                      {chat.title || 'Sin título'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-200 text-xs font-medium">
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-sm text-text-secondary dark:text-text-muted line-clamp-2 leading-relaxed mb-auto">
                    {chat.metadata?.description || 'Conversación de planificación de viaje...'}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-stroke dark:border-input-dark">
                    <span className="text-xs text-text-muted font-medium">
                      ID: {chat.id.slice(0, 8)}...
                    </span>
                    <div className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-input-dark flex items-center justify-center text-text-secondary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
