import { useUser } from '@/lib/auth';

export function useAuth() {
    return useUser();
}
