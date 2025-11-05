import Link from "next/link";
import { Twitter, Facebook, Instagram, Linkedin } from "lucide-react";
import { Logo } from "../logo";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <Link href="#" className="block">
              <svg
                width="130"
                height="35"
                viewBox="0 0 130 35"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Voaya Logo"
              >
                <path
                  d="M9.33333 1L1 18.25L9.33333 30H26L17.6667 18.25L26 1H9.33333Z"
                  className="stroke-primary-foreground"
                  strokeWidth="2"
                />
                <path
                  d="M17.6667 18.25L26 1H34.3333L26 13.5L34.3333 26H26L17.6667 18.25Z"
                  className="fill-primary-foreground"
                />
                <text
                  x="40"
                  y="21"
                  fontFamily="Inter, sans-serif"
                  fontSize="20"
                  fontWeight="bold"
                  className="fill-primary-foreground/80"
                >
                  VOAYA
                </text>
                <text
                  x="40"
                  y="33"
                  fontFamily="Inter, sans-serif"
                  fontSize="10"
                  className="fill-primary-foreground/60"
                >
                  Tu viaje, ya listo.
                </text>
              </svg>
            </Link>
            <p className="text-sm text-primary-foreground/70">
              Viajar, reinventado por la IA.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-2 md:grid-cols-3">
            <div>
              <h3 className="font-semibold tracking-wider">Enlaces</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="#about" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">Sobre Nosotros</Link></li>
                <li><Link href="#services" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">Servicios</Link></li>
                <li><Link href="#contact" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold tracking-wider">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">Términos de Servicio</Link></li>
                <li><Link href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">Política de Privacidad</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold tracking-wider">Social</h3>
              <div className="mt-4 flex space-x-4">
                <Link href="#" aria-label="Twitter">
                  <Twitter className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground" />
                </Link>
                <Link href="#" aria-label="Facebook">
                  <Facebook className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground" />
                </Link>
                <Link href="#" aria-label="Instagram">
                  <Instagram className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground" />
                </Link>
                <Link href="#" aria-label="LinkedIn">
                  <Linkedin className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/70">
          <p>&copy; {new Date().getFullYear()} Voaya. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
