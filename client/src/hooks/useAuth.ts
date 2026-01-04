import { useUser } from '@/firebase';

export function useAuth() {
    return useUser();
}
