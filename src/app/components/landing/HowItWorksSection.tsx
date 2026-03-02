import { StepCard } from './StepCard';

export function HowItWorksSection() {
  return (
    <section className="relative h-[689px] w-full overflow-clip">
      {/* Blue Background */}
      <div className="absolute left-0 top-0 bg-[#2563EB] h-[331px] w-full" />

      {/* Title */}
      <h2 className="absolute left-[586px] top-[56px] font-['Montserrat',sans-serif] font-bold text-[36px] text-white tracking-[1.8px] leading-[64px]">
        How it works
      </h2>

      {/* Description */}
      <div className="absolute left-[298px] top-[147px] font-['Montserrat',sans-serif] text-[20px] text-white leading-normal">
        <p className="mb-0">How educators save hours while students get better results - all in one platform.</p>
      </div>

      {/* Step Cards */}
      <div className="absolute left-[208px] top-[214px] w-[1024px]">
        <StepCard
          stepNumber={1}
          title="Upload Your Content"
          description="Start with what you already have: lecture notes, PDFs, presentations, or text. No reformatting needed."
          image={"../../../assets/htw-step1.png"}
          position={{ left: 0 }}
        />

        <StepCard
          stepNumber={2}
          title="AI Generates Questions"
          description="Our smart AI analyzes your material and creates relevant, challenging questions instantly."
          image={"../../../assets/htw-step2.png"}
          position={{ left: 264 }}
        />

        <StepCard
          stepNumber={3}
          title="Review & Customize"
          description="Tweak difficulty, add images, or accept as-is. You stay in control of the final product."
          image={"../../../assets/htw-step3.png"}
          position={{ left: 528 }}
        />

        <StepCard
          stepNumber={4}
          title="Share & Track Results"
          description="Send to students with one click. Watch real-time progress and scores roll in."
          image={"../../../assets/htw-step4.png"}
          position={{ left: 792 }}
        />
      </div>
    </section>
  );
}
