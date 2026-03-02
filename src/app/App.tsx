import { useState } from 'react';
import { Navbar } from './components/landing/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { MVVSection } from './components/landing/MVVSection';
import { BuiltForEveryoneSection } from './components/landing/BuiltForEveryoneSection';
import { HowItWorksSection } from './components/landing/HowItWorksSection';
import { FAQSection } from './components/landing/FAQSection';
import { Footer } from './components/landing/Footer';

/**
 * Bilgenly Landing Page
 * 
 * A production-ready landing page for an AI-powered quiz generation platform.
 * 
 * Features:
 * - Responsive design with Tailwind CSS v4
 * - Smooth scroll animations with Motion (motion/react)
 * - Interactive components (Toggle, Accordion, Buttons)
 * - Browser mockup with macOS-style chrome
 * - Mission/Vision/Values section with custom icons
 * - Teacher/Student benefit showcase
 * - Step-by-step "How it Works" section
 * - FAQ accordion with expand/collapse
 * - Footer with site navigation
 * 
 * State Management:
 * - selectedAudience: Toggle between teacher/student benefits
 * - expandedFAQs: Track which FAQ items are expanded
 */
export default function App() {
  const [selectedAudience, setSelectedAudience] = useState<'teachers' | 'students'>('teachers');
  const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set());

  const handleToggleFAQ = (index: number) => {
    const newExpanded = new Set(expandedFAQs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFAQs(newExpanded);
  };

  const handleAudienceToggle = (audience: 'teachers' | 'students') => {
    setSelectedAudience(audience);
  };

  return (
    <div className="bg-white min-h-screen w-full overflow-x-hidden">
      <Navbar />

      <main className="relative w-full max-w-[1440px] mx-auto">
        <HeroSection />
        <MVVSection />
        <BuiltForEveryoneSection selectedAudience={selectedAudience} onToggle={handleAudienceToggle} />
        <HowItWorksSection />
        <FAQSection expandedItems={expandedFAQs} onToggle={handleToggleFAQ} />
      </main>

      <Footer />
    </div>
  );
}