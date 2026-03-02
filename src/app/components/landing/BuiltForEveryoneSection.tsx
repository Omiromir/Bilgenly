import { Toggle } from './Toggle';
import { BenefitCard } from './BenefitCard';
import svgPaths from '../../../imports/svg-lz8yvnizs1';
import { motion } from 'motion/react';
import { useScrollAnimation } from './useScrollAnimation';

export interface BuiltForEveryoneSectionProps {
  selectedAudience: 'teachers' | 'students';
  onToggle: (audience: 'teachers' | 'students') => void;
}

export function BuiltForEveryoneSection({ selectedAudience, onToggle }: BuiltForEveryoneSectionProps) {
  const { ref, isVisible } = useScrollAnimation(0.2);
  const handleToggle = (index: 0 | 1) => {
    onToggle(index === 0 ? 'teachers' : 'students');
  };

  // Icon component for benefits
  const BenefitIcon = ({ pathData }: { pathData: string }) => (
    <div className="h-[59.769px] w-[62.26px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 62.2596 59.7692">
        <g>
          <rect fill="rgba(37, 99, 235, 0.3)" height="59.7692" rx="5" width="62.2596" />
          <path d={pathData} fill="#2563EB" />
        </g>
      </svg>
    </div>
  );

  return (
    <section className="relative h-[786px] w-full">
      {/* Title */}
      <h2 className="absolute left-1/2 -translate-x-1/2 top-[157px] font-['Montserrat',sans-serif] font-bold text-[36px] text-[#111827] text-center leading-[64px]">
        Built for Everyone
      </h2>

      {/* Subtitle */}
      <p className="absolute left-1/2 -translate-x-1/2 top-[226.5px] font-['Montserrat',sans-serif] text-[19.2px] text-[#4B5563] text-center leading-[30.72px]">
        Tailored features for teachers and students
      </p>

      {/* Toggle */}
      <div className="absolute left-[540px] top-[303px]">
        <Toggle
          options={['for teachers', 'for students']}
          selected={selectedAudience === 'teachers' ? 0 : 1}
          onChange={handleToggle}
          ariaLabel="Select audience type"
        />
      </div>

      {/* Benefits Grid */}
      <div className="absolute left-[215px] top-[472px] w-[1018.75px]">
        {/* Row 1 */}
        <BenefitCard
          icon={<BenefitIcon pathData={svgPaths.p48030f0} />}
          title="Save 5+ Hours Weekly"
          description="Stop spending hours creating quizzes manually. Our AI does it in seconds."
          position={{ left: 0, top: 0 }}
        />

        <BenefitCard
          icon={<BenefitIcon pathData={svgPaths.p1344f300} />}
          title="Track Student Progress"
          description="Visual dashboards show exactly where each student stands."
          position={{ left: 361.11, top: 0 }}
        />

        <BenefitCard
          icon={<BenefitIcon pathData={svgPaths.p20bfae00} />}
          title="Manage Classes Easily"
          description="One-click invites and seamless class organization."
          position={{ left: 722.21, top: 0 }}
        />

        {/* Row 2 */}
        <BenefitCard
          icon={<BenefitIcon pathData={svgPaths.p13733b80} />}
          title="Reuse Quiz Banks"
          description="Build your library and modify quizzes for future classes"
          position={{ left: 0, top: 145.65 }}
        />

        <BenefitCard
          icon={<BenefitIcon pathData={svgPaths.pc0f2680} />}
          title="Class Performance Insights"
          description="Identify struggling topics and adjust your teaching accordingly"
          position={{ left: 361.11, top: 145.65 }}
        />

        <BenefitCard
          icon={<BenefitIcon pathData={svgPaths.p2dcaff00} />}
          title="Multiple Upload Formats"
          description="PDFs, text, documents - we support them all."
          position={{ left: 722.21, top: 145.65 }}
        />
      </div>
    </section>
  );
}