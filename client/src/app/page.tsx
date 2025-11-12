import { HeroSection } from "@/components/landing/hero-section";
import { AboutSection } from "@/components/landing/about-section";
import { ServicesSection } from "@/components/landing/services-section";
import { VisionSection } from "@/components/landing/vision-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { ContactSection } from "@/components/landing/contact-section";
import AuthRedirect from '@/components/auth/AuthRedirect';

export default async function Home() {
  return (
    <>
      {/* Redirect returning authenticated users to the planner */}
      {/* AuthRedirect is a client component that will run on hydration */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      {/* Note: component does nothing visible when not authenticated */}
      {/**/}
      {/* Client component that redirects authenticated users to /plan on hydration */}
      <AuthRedirect />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <VisionSection />
      <TestimonialsSection />
      <ContactSection />
    </>
  );
}
