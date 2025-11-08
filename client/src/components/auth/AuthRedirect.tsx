'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../firebase';

/**
 * If the user is authenticated, redirect to /plan.
 * Used on the public home page so returning authenticated users land in the planner.
 */
export default function AuthRedirect() {
    const userContext = useUser() as any;
    const user = userContext?.user ?? null;
    // accommodate different shape names between client/server helpers
    const isUserLoading = (userContext?.isUserLoading ?? userContext?.loading) as boolean | undefined;
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && user) {
            // push to planner
            router.push('/plan');
        }
    }, [user, isUserLoading, router]);

    return null;
}
