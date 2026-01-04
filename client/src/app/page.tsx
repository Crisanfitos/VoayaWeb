import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { CtaSection } from "@/components/landing/cta-section";
import AuthRedirect from '@/components/auth/AuthRedirect';

export default async function Home() {
  return (
    <>
      {/* Redirect authenticated users to the planner */}
      <AuthRedirect />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </>
  );
}
