import { useState } from "react";
import {
  BuiltForEveryoneSection,
  CTASection,
  FAQSection,
  Footer,
  HeroSection,
  HowItWorksSection,
  MVVSection,
  Navbar,
  PricingSection,
  RevealOnScroll,
} from "..";

export function LandingView() {
  const [selectedAudience, setSelectedAudience] = useState<
    "teachers" | "students"
  >("teachers");
  const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set());

  const handleToggleFAQ = (index: number) => {
    setExpandedFAQs((current) => {
      const nextExpanded = new Set(current);

      if (nextExpanded.has(index)) {
        nextExpanded.delete(index);
      } else {
        nextExpanded.add(index);
      }

      return nextExpanded;
    });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      <Navbar />

      <main className="mx-auto w-full">
        <RevealOnScroll>
          <HeroSection />
        </RevealOnScroll>
        <RevealOnScroll delay={0.05}>
          <MVVSection />
        </RevealOnScroll>
        <RevealOnScroll delay={0.05}>
          <BuiltForEveryoneSection
            selectedAudience={selectedAudience}
            onToggle={setSelectedAudience}
          />
        </RevealOnScroll>
        <RevealOnScroll delay={0.05}>
          <HowItWorksSection />
        </RevealOnScroll>
        <RevealOnScroll delay={0.05}>
          <PricingSection />
        </RevealOnScroll>
        <RevealOnScroll delay={0.05}>
          <FAQSection
            expandedItems={expandedFAQs}
            onToggle={handleToggleFAQ}
          />
        </RevealOnScroll>
      </main>

      <RevealOnScroll>
        <CTASection />
      </RevealOnScroll>
      <RevealOnScroll>
        <Footer />
      </RevealOnScroll>
    </div>
  );
}
