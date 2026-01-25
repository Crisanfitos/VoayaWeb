'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BackgroundCarouselProps {
    images: string[];
    interval?: number;
    overlayGradient?: string;
    className?: string;
}

export function BackgroundCarousel({
    images,
    interval = 5000,
    overlayGradient = 'linear-gradient(rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.6) 100%)',
    className,
}: BackgroundCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, interval);

        return () => clearInterval(timer);
    }, [images.length, interval]);

    return (
        <div className={cn("absolute inset-0 z-[-1] overflow-hidden bg-slate-900", className)}>
            {images.map((image, index) => (
                <div
                    key={image}
                    className={cn(
                        "absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out",
                        index === currentIndex ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                        backgroundImage: `${overlayGradient}, url("${image}")`
                    }}
                />
            ))}
        </div>
    );
}
