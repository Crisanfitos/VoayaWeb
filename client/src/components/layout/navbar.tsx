"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useUser, useAuth } from "@/lib/auth";
import { clearVoayaCookies } from "@/lib/cookies";

const publicNavLinks = [
  { href: "/#how-it-works", label: "Cómo funciona" },
  { href: "/#features", label: "Características" },
  { href: "/#testimonials", label: "Reseñas" },
  { href: "/#about", label: "Nosotros" },
];

const privateNavLinks = [
  { href: "/plan", label: "Planificador" },
  { href: "/chats", label: "Mis Chats" },
  { href: "/my-trips", label: "Mis Viajes" },
  { href: "/settings", label: "Configuración" },
];

export function Navbar() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (auth) {
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

  const navLinks = user ? privateNavLinks : publicNavLinks;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-solid border-transparent bg-white/80 dark:bg-background-dark/90 backdrop-blur-md transition-all",
        hasScrolled && "shadow-sm border-stroke dark:border-input-dark"
      )}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10 h-16 sm:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="text-voaya-primary size-8 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">flight_takeoff</span>
          </div>
          <h2 className="text-text-main dark:text-white text-xl font-bold tracking-tight">
            Voaya
          </h2>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-text-secondary dark:text-slate-300 text-sm font-medium hover:text-voaya-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-3 items-center">
          {isUserLoading ? null : user ? (
            <>
              <Link href="/plan">
                <Button className="h-10 px-4 rounded-xl bg-voaya-primary hover:bg-voaya-primary-dark text-white text-sm font-bold shadow-lg shadow-voaya-primary/20 transition-all transform hover:scale-105">
                  <span className="material-symbols-outlined text-[20px] mr-2">add</span>
                  Nuevo Viaje
                </Button>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex h-10 px-4 items-center justify-center rounded-xl bg-transparent border border-stroke dark:border-input-dark text-text-main dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-input-dark transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] mr-2">logout</span>
                Salir
              </button>
              <Link href="/settings">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white dark:border-input-dark shadow-sm bg-slate-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-text-secondary">person</span>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="hidden sm:flex h-10 px-4 items-center justify-center rounded-xl bg-transparent border border-stroke dark:border-input-dark text-text-main dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-input-dark transition-colors">
                  Iniciar Sesión
                </button>
              </Link>
              <Link href="/plan">
                <Button className="h-10 px-4 rounded-xl bg-voaya-primary hover:bg-voaya-primary-dark text-white text-sm font-bold shadow-lg shadow-voaya-primary/20 transition-all transform hover:scale-105">
                  Planificar Viaje
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="text-text-main dark:text-white p-2">
                <span className="material-symbols-outlined text-2xl">menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white dark:bg-background-dark border-l border-stroke dark:border-input-dark">
              <SheetHeader>
                <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-8 pt-10">
                <Link href="/" className="flex items-center gap-3">
                  <div className="text-voaya-primary size-8 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">flight_takeoff</span>
                  </div>
                  <span className="text-text-main dark:text-white text-xl font-bold">Voaya</span>
                </Link>

                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.label}>
                      <Link
                        href={link.href}
                        className="text-text-secondary dark:text-slate-300 text-base font-medium hover:text-voaya-primary transition-colors py-2"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <div className="border-t border-stroke dark:border-input-dark pt-6 flex flex-col gap-3">
                  {isUserLoading ? null : user ? (
                    <>
                      <SheetClose asChild>
                        <Link href="/plan" className="w-full">
                          <Button className="w-full h-12 rounded-xl bg-voaya-primary hover:bg-voaya-primary-dark text-white font-bold">
                            <span className="material-symbols-outlined text-[20px] mr-2">add</span>
                            Nuevo Viaje
                          </Button>
                        </Link>
                      </SheetClose>
                      <button
                        onClick={handleSignOut}
                        className="w-full h-12 rounded-xl border border-stroke dark:border-input-dark text-text-main dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-input-dark transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] mr-2">logout</span>
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Link href="/login" className="w-full">
                          <button className="w-full h-12 rounded-xl border border-stroke dark:border-input-dark text-text-main dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-input-dark transition-colors">
                            Iniciar Sesión
                          </button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/signup" className="w-full">
                          <Button className="w-full h-12 rounded-xl bg-voaya-primary hover:bg-voaya-primary-dark text-white font-bold">
                            Registrarse
                          </Button>
                        </Link>
                      </SheetClose>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
