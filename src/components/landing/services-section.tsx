import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BrainCircuit, Package, Bot } from "lucide-react";

const services = [
  {
    icon: <BrainCircuit className="h-8 w-8 text-accent" />,
    title: "Búsquedas Inteligentes",
    description: "Encuentra vuelos y hoteles que realmente se adaptan a ti, gracias a nuestra IA personalizada.",
  },
  {
    icon: <Package className="h-8 w-8 text-accent" />,
    title: "Paquetes Dinámicos",
    description: "Crea tu paquete ideal de vuelo + hotel + experiencias con un solo clic. (Próximamente)",
  },
  {
    icon: <Bot className="h-8 w-8 text-accent" />,
    title: "Conserje en Destino",
    description: "Tu asistente IA te acompaña en tu destino para reservas y sugerencias en tiempo real.",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-16 md:py-24 bg-muted">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
            Una plataforma. Todo tu viaje.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Desde la inspiración hasta la reservación y más allá, te tenemos cubierto.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title} className="text-center shadow-md hover:shadow-xl transition-shadow">
              <CardHeader className="items-center">
                <div className="bg-accent/10 p-4 rounded-full">
                  {service.icon}
                </div>
                <CardTitle className="font-headline text-xl font-bold pt-4">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
