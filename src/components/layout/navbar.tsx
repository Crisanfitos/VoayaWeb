"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "#", label: "Inicio" },
  { href: "#about", label: "Sobre Nosotros" },
  { href: "#services", label: "Servicios" },
  { href: "#vision", label: "Visión" },
  { href: "#contact", label: "Contacto" },
];

export function Navbar() {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderNavLinks = (isMobile: boolean) => (
    <nav className={cn("flex items-center", isMobile ? "flex-col space-y-4" : "space-x-6")}>
      {navLinks.map((link) => {
        const LinkComponent = isMobile ? SheetClose : "a";
        const props = isMobile ? { asChild: true } : { href: link.href };
        
        return (
          <LinkComponent {...props} key={link.label}>
            <a className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
              {link.label}
            </a>
          </LinkComponent>
        );
      })}
    </nav>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent bg-card transition-shadow",
        hasScrolled && "shadow-sm border-border"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="#" className="flex items-center space-x-2">
          <span className="font-headline text-2xl font-bold text-primary">
            Voaya
          </span>
        </Link>
        <div className="hidden md:flex items-center space-x-8">
          {renderNavLinks(false)}
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="#">Empezar Búsqueda</Link>
          </Button>
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-8 pt-10">
                <Link href="#" className="flex items-center space-x-2 self-start">
                   <span className="font-headline text-2xl font-bold text-primary">Voaya</span>
                </Link>
                {renderNavLinks(true)}
                <SheetClose asChild>
                  <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                    <Link href="#">Empezar Búsqueda</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
