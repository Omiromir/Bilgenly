import { useNavigate } from 'react-router';
import { useAuth } from "../../app/providers/AuthProvider";
import { LandingButton } from './LandingButton';

export function CTASection() {
  const navigate = useNavigate();
  const { defaultRedirectPath, isAuthenticated, onboardingCompleted } = useAuth();
  const primaryActionPath = isAuthenticated ? defaultRedirectPath : "/signup";

  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Decorative glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Primary glows */}
        <div className="absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.28)_0%,transparent_70%)]" />
        <div className="absolute -right-20 bottom-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(33,145,246,0.22)_0%,transparent_70%)]" />
        {/* Central shimmer */}
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.04)_0%,transparent_70%)]" />
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Diagonal lines overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(135deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1200px]">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div className="max-w-[580px]">
            <p className="font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.14em] text-[#93C5FD]">
              Get Started Today
            </p>
            <h2
              id="cta-heading"
              className="mt-3 font-['Montserrat',sans-serif] text-[30px] font-extrabold leading-[1.18] tracking-[-0.02em] text-white [text-wrap:balance] sm:text-[46px]"
            >
              Ready to Level Up Your{" "}
              <br className="hidden sm:block" />
              Learning Experience?
            </h2>
            <p className="mt-4 font-['Inter',sans-serif] text-[15px] leading-[1.7] text-blue-200">
              Unlock AI-powered quiz creation and watch your students actually enjoy studying.
            </p>

            {/* Social proof row */}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="text-center">
                <p className="font-['Montserrat',sans-serif] text-[26px] font-extrabold text-white">10k+</p>
                <p className="font-['Inter',sans-serif] text-[12px] text-blue-200">Educators</p>
              </div>
              <div className="h-8 w-px bg-white/20" aria-hidden="true" />
              <div className="text-center">
                <p className="font-['Montserrat',sans-serif] text-[26px] font-extrabold text-white">500k+</p>
                <p className="font-['Inter',sans-serif] text-[12px] text-blue-200">Quizzes Created</p>
              </div>
              <div className="h-8 w-px bg-white/20" aria-hidden="true" />
              <div className="text-center">
                <p className="font-['Montserrat',sans-serif] text-[26px] font-extrabold text-white">4.9★</p>
                <p className="font-['Inter',sans-serif] text-[12px] text-blue-200">Average Rating</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center md:flex-col md:items-stretch lg:flex-row lg:items-center">
            <LandingButton
              variant="primary"
              size="lg"
              className="w-full min-w-[200px] !bg-white !text-[#1D4ED8] shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:!brightness-95 sm:w-auto"
              onClick={() => navigate(primaryActionPath)}
            >
              {isAuthenticated
                ? onboardingCompleted
                  ? "Open Dashboard"
                  : "Continue Setup"
                : "Get Started Free"}
            </LandingButton>
            <button
              type="button"
              className="h-12 min-w-[160px] rounded-xl border-2 border-white/40 px-6 font-['Montserrat',sans-serif] text-[15px] font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-white hover:bg-white/10 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8]"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
