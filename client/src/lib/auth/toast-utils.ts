'use client';

type ToastProps = {
    title?: string;
    description: string;
    variant?: 'default' | 'destructive';
};

export function showToast(props: ToastProps): void {
    if (typeof window !== 'undefined') {
        console.log(`${props.variant === 'destructive' ? '❌' : '✅'} ${props.title}: ${props.description}`);
    }
}
