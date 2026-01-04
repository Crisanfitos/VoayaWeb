import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-stroke dark:border-input-dark py-12 px-4 sm:px-10">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-voaya-primary text-2xl">flight_takeoff</span>
              <span className="text-xl font-bold text-text-main dark:text-white">Voaya</span>
            </Link>
            <p className="text-sm text-text-secondary dark:text-text-muted">
              Tu compañero de viaje inteligente. Planifica, reserva y explora con el poder de la IA.
            </p>
          </div>

          {/* Producto */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-text-main dark:text-white">
              Producto
            </h4>
            <Link href="/plan" className="text-sm text-text-secondary dark:text-text-muted hover:text-voaya-primary transition-colors">
              Características
            </Link>
            <Link href="#" className="text-sm text-text-secondary dark:text-text-muted hover:text-voaya-primary transition-colors">
              Precios
            </Link>
            <Link href="#" className="text-sm text-text-secondary dark:text-text-muted hover:text-voaya-primary transition-colors">
              App Móvil
            </Link>
          </div>

          {/* Compañía */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-text-main dark:text-white">
              Compañía
            </h4>
            <Link href="/#about" className="text-sm text-text-secondary dark:text-text-muted hover:text-voaya-primary transition-colors">
              Sobre Nosotros
            </Link>
            <Link href="#" className="text-sm text-text-secondary dark:text-text-muted hover:text-voaya-primary transition-colors">
              Blog
            </Link>
            <Link href="/#contact" className="text-sm text-text-secondary dark:text-text-muted hover:text-voaya-primary transition-colors">
              Contacto
            </Link>
          </div>

          {/* Legal + Social */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-text-main dark:text-white">
              Legal
            </h4>
            <Link href="#" className="text-sm text-text-secondary dark:text-text-muted hover:text-voaya-primary transition-colors">
              Privacidad
            </Link>
            <Link href="#" className="text-sm text-text-secondary dark:text-text-muted hover:text-voaya-primary transition-colors">
              Términos
            </Link>
            <div className="flex gap-4 mt-2">
              <Link href="#" className="text-text-muted hover:text-voaya-primary transition-colors" aria-label="Twitter">
                <span className="material-symbols-outlined text-xl">public</span>
              </Link>
              <Link href="#" className="text-text-muted hover:text-voaya-primary transition-colors" aria-label="Email">
                <span className="material-symbols-outlined text-xl">mail</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-stroke dark:border-input-dark flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Voaya Inc. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-text-muted">
              Hecho con ❤️ para viajeros
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
