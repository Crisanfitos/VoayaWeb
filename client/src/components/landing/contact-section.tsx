import { ContactForm } from './contact-form';

export function ContactSection() {
  return (
    <section id="contact" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
              Empieza a planificar tu próximo viaje.
            </h2>
            <p className="text-lg text-muted-foreground">
              Regístrate para obtener acceso temprano o contáctanos para más información.
            </p>
          </div>
          <div className="w-full">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
