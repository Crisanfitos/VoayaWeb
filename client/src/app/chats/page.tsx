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
  titulo?: string;
  title?: string; // alias para compatibilidad
  estado?: string;
  status?: string; // alias para compatibilidad
  ultimoMensajeEn?: string;
  lastMessageAt?: any; // alias para compatibilidad
  metadatos?: any;
  metadata?: any; // alias para compatibilidad
  esFavorito?: boolean;
  imagenUrl?: string;
};

type FilterType = 'all' | 'active' | 'completed' | 'favorites';

const statusConfig: Record<string, { bg: string; text: string }> = {
  'active': { bg: 'bg-voaya-primary', text: 'En Proceso' },
  'completed': { bg: 'bg-green-500', text: 'Completado' },
  'archived': { bg: 'bg-gray-500/80', text: 'Archivado' },
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);

  useEffect(() => {
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

  const loadChats = async () => {
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

  useEffect(() => {
    if (user) {
      loadChats();
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

  const handleToggleFavorite = async (e: React.MouseEvent, chat: ChatItem) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setTogglingFavoriteId(chat.id);

    try {
      const nuevoEstado = !chat.esFavorito;
      await ApiService.alternarChatFavorito(chat.id, nuevoEstado);
      setChats(prev => prev.map(c =>
        c.id === chat.id ? { ...c, esFavorito: nuevoEstado } : c
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setMenuOpenId(null);

    if (!confirm('¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingId(chatId);
    try {
      await ApiService.eliminarChat(chatId);
      setChats(prev => prev.filter(c => c.id !== chatId));
    } catch (err) {
      console.error('Error deleting chat:', err);
      alert('Error al eliminar el chat');
    } finally {
      setDeletingId(null);
    }
  };

  const getTitle = (chat: ChatItem) => chat.titulo || chat.title || 'Sin título';
  const getStatus = (chat: ChatItem) => chat.estado || chat.status || 'active';
  const getLastMessageAt = (chat: ChatItem) => chat.ultimoMensajeEn || chat.lastMessageAt;
  const getMetadata = (chat: ChatItem) => chat.metadatos || chat.metadata || {};

  const filteredChats = chats.filter(chat => {
    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = getTitle(chat).toLowerCase();
      const destino = getMetadata(chat)?.destino?.toLowerCase() || '';
      if (!title.includes(query) && !destino.includes(query) && !chat.id.includes(query)) {
        return false;
      }
    }

    // Filtro por estado
    const status = getStatus(chat);
    switch (activeFilter) {
      case 'active':
        return status === 'active';
      case 'completed':
        return status === 'completed';
      case 'favorites':
        return chat.esFavorito === true;
      default:
        return true;
    }
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
            onClick={() => setActiveFilter('active')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-5 transition-colors shadow-sm ${activeFilter === 'active'
              ? 'bg-text-main dark:bg-white text-white dark:text-text-main font-bold'
              : 'bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark hover:bg-gray-50 dark:hover:bg-input-dark text-text-secondary'
              }`}
          >
            <span className="text-sm font-medium">En proceso</span>
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
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeFilter === 'favorites' ? "'FILL' 1" : "'FILL' 0" }}>star</span>
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
              {activeFilter === 'favorites'
                ? 'No tienes chats favoritos. Marca alguno con la estrella.'
                : 'No tienes chats que coincidan con los filtros.'}
            </div>
          )}

          {filteredChats.map((chat, index) => {
            const status = statusConfig[getStatus(chat)] || statusConfig['active'];
            const imageUrl = chat.imagenUrl || destinationImages[index % destinationImages.length];
            const isDeleting = deletingId === chat.id;
            const isTogglingFavorite = togglingFavoriteId === chat.id;

            return (
              <div
                key={chat.id}
                className={`group relative flex flex-col bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm border border-stroke dark:border-input-dark hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:border-voaya-primary/30 transition-all duration-300 cursor-pointer h-full ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Card Content - Clickable */}
                <div
                  onClick={() => handleChatClick(chat)}
                  className="flex flex-col flex-1 text-left w-full cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url("${imageUrl}")` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} text-white shadow-sm backdrop-blur-md border border-white/10`}>
                        {status.text}
                      </span>
                    </div>

                    {/* Favorite Star */}
                    <div
                      onClick={(e) => handleToggleFavorite(e, chat)}
                      role="button"
                      tabIndex={0}
                      className={`absolute top-3 right-3 size-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${chat.esFavorito
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/20 text-white hover:bg-white/40'
                        } backdrop-blur-md border border-white/20 ${isTogglingFavorite ? 'opacity-50' : ''}`}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: chat.esFavorito ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 p-4 w-full">
                      <h3 className="text-white text-xl font-bold leading-tight mb-1">
                        {getTitle(chat)}
                      </h3>
                      <div className="flex items-center gap-1.5 text-gray-200 text-xs font-medium">
                        <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                        {getLastMessageAt(chat) ? new Date(getLastMessageAt(chat)).toLocaleDateString('es-ES') : 'Sin fecha'}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-sm text-text-secondary dark:text-text-muted line-clamp-2 leading-relaxed mb-auto">
                      {getMetadata(chat)?.destino || 'Conversación de planificación de viaje...'}
                    </p>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="px-4 pb-4 flex items-center justify-between pt-2 border-t border-stroke dark:border-input-dark">
                  <span className="text-xs text-text-muted font-medium">
                    ID: {chat.id.slice(0, 8)}...
                  </span>

                  {/* Menu Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                      }}
                      className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-input-dark flex items-center justify-center text-text-secondary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpenId === chat.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-stroke dark:border-input-dark py-2 z-50">
                        <button
                          onClick={(e) => handleToggleFavorite(e, chat)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-input-dark flex items-center gap-2 text-text-main dark:text-white"
                        >
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: chat.esFavorito ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                          {chat.esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        </button>
                        <button
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Eliminar chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Click outside to close menu */}
      {menuOpenId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpenId(null)}
        />
      )}
    </main>
  );
}
