"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const testimonials = [
  {
    id: 1,
    name: "Ana García",
    quote: "¡La mejor experiencia de reserva! El asistente IA me ayudó a encontrar un hotel perfecto que no había visto en otras plataformas.",
    avatarId: "testimonial-avatar-1"
  },
  {
    id: 2,
    name: "Carlos Rodriguez",
    quote: "Voaya entendió mis preferencias de viaje al instante. Las recomendaciones de vuelos fueron increíblemente precisas y me ahorraron horas de búsqueda.",
    avatarId: "testimonial-avatar-2"
  },
  {
    id: 3,
    name: "Sofia Martinez",
    quote: "El conserje en destino es un cambio de juego. Obtuve sugerencias de restaurantes y reservé tours directamente desde la app. ¡Asombroso!",
    avatarId: "testimonial-avatar-3"
  },
];

export function TestimonialsSection() {
    const avatarImages = PlaceHolderImages.filter(p => p.id.startsWith('testimonial-avatar'));
  
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
            Lo que dicen nuestros viajeros
          </h2>
        </div>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-4xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial) => {
              const avatar = avatarImages.find(img => img.id === testimonial.avatarId);
              return (
                <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="flex flex-col justify-between h-full shadow-sm">
                      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                        <p className="text-muted-foreground italic">&ldquo;{testimonial.quote}&rdquo;</p>
                        <div className="flex items-center space-x-4 pt-4">
                          <Avatar>
                            {avatar && <AvatarImage src={avatar.imageUrl} alt={testimonial.name} data-ai-hint={avatar.imageHint} />}
                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-semibold">{testimonial.name}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
