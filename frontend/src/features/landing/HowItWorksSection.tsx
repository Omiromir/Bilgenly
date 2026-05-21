import { StepCard } from './StepCard';
import step1 from "../../assets/htw-step1.png";
import step2 from "../../assets/htw-step2.png";
import step3 from "../../assets/htw-step3.png";
import step4 from "../../assets/htw-step4.png";

const steps = [
  {
    stepNumber: 1,
    title: 'Upload Your Content',
    description: 'Start with what you already have: lecture notes, PDFs, presentations, or text.',
    image: step1
  },
  {
    stepNumber: 2,
    title: 'AI Generates Questions',
    description: 'Our smart AI analyzes your material and creates relevant questions instantly.',
    image: step2
  },
  {
    stepNumber: 3,
    title: 'Customize & Share',
    description: 'Adjust difficulty and content, then share with your class in one click.',
    image: step3
  },
  {
    stepNumber: 4,
    title: 'Analyze Results',
    description: 'Track scores and progress with real-time analytics and clear dashboards.',
    image: step4
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24">
      {/* Header band */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#4F46E5] px-4 pb-32 pt-16 sm:px-6 lg:px-8">
        {/* Decorative circles + depth */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {/* Large rings */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/5" />
          <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-white/5" />
          <div className="absolute left-[40%] top-[-60px] h-32 w-32 rounded-full bg-white/[0.04]" />
          {/* Dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Diagonal lines */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(45deg, #fff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1200px] text-center">
          <p className="font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.12em] text-blue-200">
            Simple Process
          </p>
          <h2 className="mt-3 font-['Montserrat',sans-serif] text-[28px] font-extrabold tracking-[-0.01em] text-white [text-wrap:balance] sm:text-[42px]">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-[660px] font-['Inter',sans-serif] text-[15px] leading-[1.65] text-blue-100 sm:text-[17px]">
            How educators save hours while students get better results — all in one platform.
          </p>
        </div>

        {/* SVG wave at bottom — blends into white background */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            className="w-full"
            style={{ display: "block", height: "60px" }}
          >
            <path d="M0,30 C360,70 1080,0 1440,30 L1440,60 L0,60 Z" className="fill-white dark:fill-[#0d1424]" />
          </svg>
        </div>
      </div>

      {/* Cards pulled up over the band */}
      <div className="-mt-16 px-4 pb-20 sm:px-6 lg:px-8 dark:bg-[#0d1424]">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <StepCard key={step.stepNumber} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
