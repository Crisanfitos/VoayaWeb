import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function HeroSection() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-background');

  return (
    <section className="relative h-screen w-full">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-primary-foreground">
        <div className="container mx-auto px-4">
          <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
            Viajar, reinventado por la IA.
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-primary-foreground/90 md:text-xl">
            Tu compañero de viaje inteligente para búsquedas personalizadas y asistencia en destino.
          </p>
          <div className="mt-10">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="#services">Descubre tu próximo destino</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
