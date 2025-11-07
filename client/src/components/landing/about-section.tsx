import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function AboutSection() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'about-us-image');

  return (
    <section id="about" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg">
             {aboutImage && (
              <Image
                src={aboutImage.imageUrl}
                alt={aboutImage.description}
                fill
                className="object-cover"
                data-ai-hint={aboutImage.imageHint}
              />
            )}
          </div>
          <div className="space-y-4">
            <h2 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
              Somos Voaya.
            </h2>
            <p className="text-lg text-muted-foreground">
              Voaya es una plataforma de viajes impulsada por IA que ofrece búsquedas personalizadas de vuelos/hoteles y un conserje IA en destino, proporcionando una experiencia integral y fluida de principio a fin para el viajero moderno.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
