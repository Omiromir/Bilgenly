import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../app/providers/AuthProvider";
import { BrowserMockup } from "./BrowserMockup";
import { DemoVideoModal, DemoVideoPreview } from "./DemoVideo";
import { LandingButton } from "./LandingButton";

export function HeroSection() {
  const navigate = useNavigate();
  const { defaultRedirectPath, isAuthenticated, onboardingCompleted } = useAuth();
  const primaryActionPath = isAuthenticated ? defaultRedirectPath : "/signup";
  const shouldReduceMotion = useReducedMotion();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const fadeUp = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.01 } }
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  return (
    <section
      id="home"
      className="relative scroll-mt-24 overflow-hidden px-4 pt-[120px] sm:px-6 sm:pt-[148px] lg:px-8 lg:pt-[168px]"
    >
      {/* Ambient gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {/* Top-left violet glow */}
        <div className="absolute -left-32 -top-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.13)_0%,transparent_70%)]" />
        {/* Top-right blue glow */}
        <div className="absolute -right-20 top-10 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(33,145,246,0.11)_0%,transparent_70%)]" />
        {/* Center-bottom warm accent */}
        <div className="absolute bottom-[-60px] left-1/2 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(37,99,235,0.06)_0%,transparent_70%)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.022] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#111827 1px,transparent 1px),linear-gradient(90deg,#111827 1px,transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

      </div>

      {/* Floating glowing bubbles — above bg layer, below content */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[6%] top-[22%] h-[160px] w-[160px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.28)_0%,rgba(99,102,241,0.12)_40%,transparent_70%)] blur-[28px]"
        animate={shouldReduceMotion ? {} : { y: [0, -24, 0], x: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-[16%] h-[120px] w-[120px] rounded-full bg-[radial-gradient(circle,rgba(33,145,246,0.32)_0%,rgba(33,145,246,0.14)_40%,transparent_70%)] blur-[22px]"
        animate={shouldReduceMotion ? {} : { y: [0, 22, 0], x: [0, -14, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[20%] top-[60%] h-[90px] w-[90px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.3)_0%,rgba(139,92,246,0.12)_45%,transparent_70%)] blur-[18px]"
        animate={shouldReduceMotion ? {} : { y: [0, 18, 0], x: [0, 10, 0] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[20%] top-[52%] h-[140px] w-[140px] rounded-full bg-[radial-gradient(circle,rgba(33,145,246,0.22)_0%,rgba(33,145,246,0.1)_45%,transparent_70%)] blur-[26px]"
        animate={shouldReduceMotion ? {} : { y: [0, -16, 0], x: [0, -8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[46%] top-[10%] h-[80px] w-[80px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.3)_0%,rgba(99,102,241,0.12)_45%,transparent_70%)] blur-[16px]"
        animate={shouldReduceMotion ? {} : { y: [0, 20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="mx-auto max-w-[1200px] text-center">
        <motion.h1
          className="mx-auto max-w-[860px] font-['Montserrat',sans-serif] text-[34px] font-extrabold leading-[1.18] tracking-[-0.02em] text-[#02080E] [text-wrap:balance] sm:text-[48px] lg:text-[60px] dark:text-[#f5f8ff]"
          {...fadeUp}
          transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.05 }}
        >
          Learn{" "}
          <span className="bg-gradient-to-r from-[#2191F6] to-[#6366F1] bg-clip-text text-transparent">
            Smarter
          </span>
          , Teach{" "}
          <span className="bg-gradient-to-r from-[#6366F1] to-[#2191F6] bg-clip-text text-transparent">
            Faster
          </span>{" "}
          with AI
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-[500px] font-['Inter',sans-serif] text-[17px] font-normal leading-[1.75] text-[#4B5563] sm:mt-8 sm:text-[19px] dark:text-[#9aa8c6]"
          {...fadeUp}
          transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.15 }}
        >
          Create, share, and discover quizzes in seconds — for study,
          practice, or classroom use.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          {...fadeUp}
          transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.25 }}
        >
          <LandingButton
            variant="primary"
            size="md"
            className="w-full max-w-[220px] sm:w-auto"
            onClick={() => navigate(primaryActionPath)}
          >
            {isAuthenticated
              ? onboardingCompleted
                ? "Go to Dashboard"
                : "Continue Setup"
              : "Get Started Free"}
          </LandingButton>
          <LandingButton
            variant="secondary"
            size="md"
            className="w-full max-w-[220px] sm:w-auto"
            onClick={() => setIsVideoModalOpen(true)}
          >
            Watch Demo
          </LandingButton>
        </motion.div>

        {/* Trust micro-copy */}
        <motion.p
          className="mt-4 font-['Inter',sans-serif] text-[13px] text-[#9CA3AF] dark:text-[#72809f]"
          {...fadeUp}
          transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.32 }}
        >
          No credit card required &middot; Free forever plan
        </motion.p>

        <motion.div
          className="relative mt-12 sm:mt-16"
          {...fadeUp}
          transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : 0.42 }}
        >
          <BrowserMockup>
            <DemoVideoPreview onExpand={() => setIsVideoModalOpen(true)} />
          </BrowserMockup>
          <div className="pointer-events-none absolute -bottom-7 left-1/2 h-20 w-[92%] -translate-x-1/2 rounded-[24px] bg-white blur-[18px] sm:-bottom-10 sm:h-28 sm:rounded-[32px] sm:blur-[22px] dark:bg-[#0d1424]" />
        </motion.div>

        <div className="pointer-events-none mx-auto -mt-3 h-[30px] w-full rounded-[28px] bg-white shadow-[0_24px_70px_rgba(255,255,255,1)] sm:-mt-6 sm:h-[140px] sm:rounded-[40px] sm:shadow-[0_44px_110px_rgba(255,255,255,1)] dark:bg-[#0d1424] dark:shadow-[0_24px_70px_rgba(13,20,36,1)] sm:dark:shadow-[0_44px_110px_rgba(13,20,36,1)]" />
      </div>

      {/* Fullscreen video modal — rendered outside the centered container so it
          covers the entire viewport without any layout constraints. */}
      <DemoVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </section>
  );
}
