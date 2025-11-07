'use client';

type ToastProps = {
    title?: string;
    description: string;
    variant?: 'default' | 'destructive';
};

export function showToast(props: ToastProps): void {
    // This is a simple implementation that will work both on client and server side
    if (typeof window !== 'undefined') {
        // Client-side only code
        console.log(`${props.variant === 'destructive' ? '❌' : '✅'} ${props.title}: ${props.description}`);
    }
}