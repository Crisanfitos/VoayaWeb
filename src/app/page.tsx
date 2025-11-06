import { HeroSection } from "@/components/landing/hero-section";
import { AboutSection } from "@/components/landing/about-section";
import { ServicesSection } from "@/components/landing/services-section";
import { VisionSection } from "@/components/landing/vision-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { ContactSection } from "@/components/landing/contact-section";
import { getModelInfo } from "@/app/actions";

export default async function Home() {
  const modelInfo = await getModelInfo();
  console.log(modelInfo);
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <VisionSection />
      <TestimonialsSection />
      <ContactSection />
    </>
  );
}
