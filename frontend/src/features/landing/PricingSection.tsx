import { useNavigate } from "react-router";
import { useAuth } from "../../app/providers/AuthProvider";

const freeFeatures = [
  '5 AI quizzes per month',
  'Basic analytics',
  'Public library access',
  'Community features',
  'Mobile app access',
];

const proFeatures = [
  'Unlimited AI quizzes',
  'Advanced analytics & insights',
  'Priority support',
  'PDF & document export',
  'Class management tools',
  'Custom branding',
];

function CheckIcon({ highlighted }: { highlighted?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${highlighted ? 'text-[#2563EB]' : 'text-[#8B5CF6]'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PricingCard({
  name,
  price,
  period,
  subtitle,
  features,
  ctaLabel,
  highlighted,
  onCta,
}: {
  name: string;
  price: string;
  period: string;
  subtitle: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
  onCta?: () => void;
}) {
  return (
    <article
      className={
        highlighted
          ? 'relative flex flex-col rounded-3xl border-2 border-[#2563EB] bg-white p-7 shadow-[0_12px_40px_rgba(37,99,235,0.18)] sm:p-9 dark:border-[#7a72ff] dark:bg-[#18233b] dark:shadow-[0_12px_40px_rgba(122,114,255,0.18)]'
          : 'relative flex flex-col rounded-3xl border border-[#E5E7EB] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-9 dark:border-[#2a3858] dark:bg-[#18233b] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
      }
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-white shadow-lg">
            <svg aria-hidden="true" className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Most Popular
          </span>
        </div>
      )}

      <div>
        <h3 className="font-['Montserrat',sans-serif] text-[16px] font-bold uppercase tracking-[0.08em] text-[#6B7280] dark:text-[#9aa8c6]">
          {name}
        </h3>
        <div className="mt-4 flex items-end gap-1">
          <span
            className={`font-['Montserrat',sans-serif] text-[52px] font-extrabold leading-none tracking-[-0.03em] ${
              highlighted ? 'text-[#2563EB] dark:text-[#7a72ff]' : 'text-[#111827] dark:text-[#f5f8ff]'
            }`}
          >
            {price}
          </span>
          <span className="mb-2 font-['Inter',sans-serif] text-[16px] text-[#9CA3AF] dark:text-[#72809f]">
            {period}
          </span>
        </div>
        <p className="mt-2 font-['Inter',sans-serif] text-[14px] text-[#6B7280] dark:text-[#9aa8c6]">
          {subtitle}
        </p>
      </div>

      <ul className="mt-7 flex-1 space-y-3 border-t border-[#F3F4F6] pt-6 dark:border-[#2a3858]">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <CheckIcon highlighted={!highlighted} />
            <span className="font-['Inter',sans-serif] text-[14px] leading-[1.5] text-[#374151] dark:text-[#dde6f7]">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCta}
        className={
          highlighted
            ? "mt-8 h-12 w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] font-['Montserrat',sans-serif] text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 dark:from-[#7a72ff] dark:to-[#4F46E5] dark:shadow-[0_4px_16px_rgba(122,114,255,0.35)]"
            : "mt-8 h-12 w-full rounded-xl border-2 border-[#E5E7EB] bg-white font-['Montserrat',sans-serif] text-[15px] font-bold text-[#374151] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-[#2563EB] hover:text-[#2563EB] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 dark:border-[#2a3858] dark:bg-transparent dark:text-[#dde6f7] dark:hover:border-[#7a72ff] dark:hover:text-[#7a72ff]"
        }
      >
        {ctaLabel}
      </button>
    </article>
  );
}

export function PricingSection() {
  const navigate = useNavigate();
  const { isAuthenticated, defaultRedirectPath } = useAuth();

  const handleCta = () => {
    navigate(isAuthenticated ? defaultRedirectPath : "/signup");
  };

  return (
    <section id="pricing" className="relative scroll-mt-24 overflow-hidden bg-[#F8FAFF] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 dark:bg-[#111b2f]">
      {/* Background decorations */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Centered glow behind the pricing cards */}
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.06)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(122,114,255,0.07)_0%,transparent_65%)]" />
        {/* Corner accents */}
        <div className="absolute -left-32 bottom-10 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.07)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(99,102,241,0.09)_0%,transparent_65%)]" />
        <div className="absolute -right-32 top-10 h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(33,145,246,0.07)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(102,179,255,0.06)_0%,transparent_65%)]" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.018] dark:opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #2563EB 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Top separator line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/15 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1200px]">
        <div className="text-center">
          <p className="font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.12em] text-[#2191F6] dark:text-[#66b3ff]">
            Pricing
          </p>
          <h2 className="mt-3 font-['Montserrat',sans-serif] text-[28px] font-extrabold tracking-[-0.02em] text-[#111827] [text-wrap:balance] sm:text-[44px] dark:text-[#f5f8ff]">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 font-['Inter',sans-serif] text-[16px] text-[#6B7280] dark:text-[#9aa8c6]">
            Start free, upgrade when you&apos;re ready. No hidden fees.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-[860px] grid-cols-1 gap-8 pt-4 md:grid-cols-2">
          <PricingCard
            name="Free"
            price="$0"
            period="/forever"
            subtitle="Perfect for trying out the platform"
            features={freeFeatures}
            ctaLabel="Get Started Free"
            onCta={handleCta}
          />
          <PricingCard
            name="Pro"
            price="$9"
            period="/month"
            subtitle="For serious educators and learners"
            features={proFeatures}
            ctaLabel="Start Free Trial"
            highlighted
            onCta={handleCta}
          />
        </div>

        <p className="mt-8 text-center font-['Inter',sans-serif] text-[13px] text-[#9CA3AF] dark:text-[#72809f]">
          All plans include a 14&#8209;day free trial &middot; Cancel any time
        </p>
      </div>
    </section>
  );
}
