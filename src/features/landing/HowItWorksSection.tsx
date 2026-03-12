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
    <section id="how-it-works" className="relative mt-8 min-h-[100svh] scroll-mt-24">
      <div className="bg-[#2563EB] px-4 pb-24 pt-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px] text-center">
          <h2 className="font-['Montserrat',sans-serif] text-[30px] font-bold tracking-[1px] text-white sm:text-[40px] sm:tracking-[2px]">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-[760px] font-['Montserrat',sans-serif] text-[15px] leading-[1.6] text-white/90 sm:text-[18px]">
            How educators save hours while students get better results. It&apos;s all in one platform.
          </p>
        </div>
      </div>

      <div className="-mt-16 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1030px] grid-cols-1 gap-15 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <StepCard key={step.stepNumber} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
