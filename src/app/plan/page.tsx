'use client';

import { useUser, useFirestore, useAuth } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { doc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plane, Hotel, Mountain } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatView } from '@/components/chat/chat-view';

type SearchCategory = 'flights' | 'hotels' | 'experiences';

function PlanPageComponent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  // State for the initial planning form
  const [tripDescription, setTripDescription] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<SearchCategory>>(new Set(['flights']));
  
  // State for the chat view
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');
    if (chatIdFromUrl) {
      setChatId(chatIdFromUrl);
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDescription || !firestore || !user) return;

    setIsStartingChat(true);

    try {
      // 1. Create a new chat document in Firestore
      const chatCollectionRef = collection(firestore, 'chats');
      const newChatDoc = await addDoc(chatCollectionRef, {
        userId: user.uid,
        createdAt: serverTimestamp(),
        title: tripDescription.substring(0, 40) + '...', // Use first part of message as title
      });

      // 2. Add the first message to the 'messages' subcollection
      const messagesCollectionRef = collection(firestore, 'chats', newChatDoc.id, 'messages');
      await addDoc(messagesCollectionRef, {
        text: tripDescription,
        role: 'user',
        createdAt: serverTimestamp(),
      });
      
      // 3. Set the chatId to switch to the chat view, and update URL
      router.push(`/plan?chatId=${newChatDoc.id}`);
      setChatId(newChatDoc.id);

    } catch (error) {
      console.error("Error starting new chat:", error);
      // You might want to show a toast message here
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user || !firestore) {
    return null;
  }

  if (chatId) {
    return <ChatView chatId={chatId} />;
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
