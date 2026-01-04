"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Logo } from "../logo";
import { useUser, useAuth } from "@/lib/auth";
import { clearVoayaCookies } from "@/lib/cookies";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/#about", label: "Sobre Nosotros" },
  { href: "/#services", label: "Servicios" },
  { href: "/#vision", label: "Visión" },
  { href: "/#contact", label: "Contacto" },
];

const privateNavLinks = [
  { href: "/plan", label: "Planificador" },
  { href: "/chats", label: "Chats" },
  { href: "/my-trips", label: "Mis Viajes" },
  { href: "/settings", label: "Configuración" },
]

export function Navbar() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (auth) {
      // Clear cookies before signing out
      clearVoayaCookies();
      await auth.signOut();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderNavLinks = (links: { href: string, label: string }[], isMobile: boolean) => (
    <nav className={cn("flex items-center", isMobile ? "flex-col space-y-4" : "space-x-6")}>
      {links.map((link) => {
        const LinkComponent = isMobile ? SheetClose : 'div';
        const props = isMobile ? { asChild: true } : {};

        return (
          <LinkComponent {...props} key={link.label}>
            <Link href={link.href} passHref>
              <span className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
                {link.label}
              </span>
            </Link>
          </LinkComponent>
        );
      })}
    </nav>
  );

  const renderAuthButtons = (isMobile: boolean) => {
    if (isUserLoading) {
      return null;
    }

    if (user) {
      return (
        <div className={cn("flex items-center", isMobile ? "flex-col space-y-4 w-full" : "space-x-4")}>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      )
    }

    return (
      <div className={cn("flex items-center", isMobile ? "flex-col space-y-4 w-full" : "space-x-2")}>
        <Button asChild variant="ghost">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
        <Button asChild className={cn("bg-accent text-accent-foreground hover:bg-accent/90", isMobile && "w-full")}>
          <Link href="/signup">Registrarse</Link>
        </Button>
      </div>
    )
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent bg-card transition-shadow",
        hasScrolled && "shadow-sm border-border"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Logo />
        </Link>
        <div className="hidden md:flex items-center space-x-8">
          {renderNavLinks(user ? privateNavLinks : navLinks, false)}
          {renderAuthButtons(false)}
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-8 pt-10">
                <Link href="/" className="flex items-center space-x-2 self-start">
                  <Logo />
                </Link>
                {renderNavLinks(user ? privateNavLinks : navLinks, true)}
                <div className="border-t border-border pt-6">
                  {renderAuthButtons(true)}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
