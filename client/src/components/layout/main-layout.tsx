"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isChatPage = pathname?.startsWith('/chats/') && pathname !== '/chats';

    return (
        <main className={cn(
            !isChatPage && "min-h-screen",
            isChatPage && "overflow-hidden bg-background-light dark:bg-background"
        )}>
            {children}
        </main>
    );
}
