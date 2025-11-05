'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Chat {
  id: string;
  title: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export default function ChatsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'chats'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: chats, isLoading: areChatsLoading } = useCollection<Chat>(chatsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isUserLoading || areChatsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Mis Chats</h1>

        {chats && chats.length > 0 ? (
           <div className="grid gap-4">
            {chats.map(chat => (
              <Link href={`/plan?chatId=${chat.id}`} key={chat.id} passHref>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      {chat.title}
                    </CardTitle>
                     <CardDescription>
                      {chat.createdAt ? 
                        `Iniciado ${formatDistanceToNow(new Date(chat.createdAt.seconds * 1000), { addSuffix: true, locale: es })}`
                        : ''}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold text-muted-foreground">No tienes chats todavía</h3>
            <p className="text-muted-foreground mt-2">¡Empieza a planificar un viaje para iniciar tu primer chat!</p>
            <Button asChild className="mt-4">
              <Link href="/plan">Planificar un Viaje</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
